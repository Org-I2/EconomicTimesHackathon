"""
OCR service.

Turns raw image/PDF-page bytes into text, for documents that don't have a
clean text layer (scanned inspection reports, photographed nameplates,
faxed SOPs, etc).

Pipeline: preprocess_image() cleans the image up for OCR (grayscale,
adaptive threshold, deskew) -> extract_text_from_image() runs pytesseract
on the cleaned image and reports its own confidence.

This module deliberately does NOT apply ocr_low_confidence_threshold from
config — it only reports the real average_confidence value. Deciding what
counts as "too low to trust" (e.g. flagging a document for manual review,
or excluding a chunk from the RAG index) is the caller's decision.
"""

from __future__ import annotations

import logging
import os
import shutil

import cv2
import numpy as np
import pytesseract

logger = logging.getLogger(__name__)

# pytesseract only wraps the tesseract CLI binary — it doesn't install it.
# If it's already on PATH, shutil.which() finds it and we leave pytesseract's
# default alone. If not, we check the handful of locations it's commonly
# installed to (mainly Windows, where it's rarely added to PATH by default)
# and point pytesseract at it directly. If none of these hit, we deliberately
# do nothing further here — pytesseract will raise its own
# TesseractNotFoundError with setup instructions the first time it's used,
# which is more useful than silently failing later.
_COMMON_TESSERACT_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    "/usr/bin/tesseract",
    "/usr/local/bin/tesseract",
    "/opt/homebrew/bin/tesseract",  # Apple Silicon Homebrew
]

if shutil.which("tesseract") is None:
    for candidate in _COMMON_TESSERACT_PATHS:
        if os.path.isfile(candidate):
            pytesseract.pytesseract.tesseract_cmd = candidate
            logger.info("Found tesseract binary at %s (not on PATH)", candidate)
            break

# DPI used when rasterizing PDF pages to images. 300 is a standard sweet
# spot for OCR — high enough for small print, without being so large that
# rasterization/OCR gets slow on multi-page documents.
_PDF_RASTER_DPI = 300


def preprocess_image(image_bytes: bytes) -> bytes:
    """
    Clean up a raw image for OCR: grayscale conversion, adaptive
    thresholding, then deskew.

    Args:
        image_bytes: Raw encoded image bytes (e.g. PNG/JPEG), such as a
            photographed inspection report page.

    Returns:
        PNG-encoded bytes of the processed (grayscale, thresholded,
        deskewed) image.

    Raises:
        ValueError: if image_bytes cannot be decoded as an image, or is
            empty.
    """
    if not image_bytes:
        raise ValueError("preprocess_image received empty image_bytes")

    array = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(array, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("preprocess_image could not decode image_bytes as an image")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Adaptive threshold (not a single global threshold) since scanned
    # plant documents often have uneven lighting/shadow across the page.
    thresholded = cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        15,
    )

    deskewed = _deskew(thresholded)

    success, encoded = cv2.imencode(".png", deskewed)
    if not success:
        raise ValueError("preprocess_image failed to encode the processed image")

    return encoded.tobytes()


def _deskew(binary_img: np.ndarray) -> np.ndarray:
    """
    Rotate a binary (black-text-on-white) image so its text is horizontal.

    Estimates skew from the bounding rectangle of all foreground (text)
    pixels. If there aren't enough foreground pixels to get a reliable
    estimate (e.g. a near-blank page), the image is returned unchanged
    rather than risking a wild rotation.
    """
    # After THRESH_BINARY on a light-background page, text pixels are 0 (black).
    coords = np.column_stack(np.where(binary_img == 0))
    if coords.shape[0] < 20:
        return binary_img

    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle

    # Skip negligible skew — rotating a near-straight image only adds
    # interpolation blur for no benefit.
    if abs(angle) < 0.5:
        return binary_img

    height, width = binary_img.shape[:2]
    center = (width // 2, height // 2)
    matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(
        binary_img,
        matrix,
        (width, height),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=255,
    )
    return rotated


def extract_text_from_image(image_bytes: bytes) -> dict:
    """
    Run OCR on an image and report pytesseract's own confidence.

    Args:
        image_bytes: Raw encoded image bytes. Internally preprocessed via
            preprocess_image() before OCR.

    Returns:
        {"text": str, "average_confidence": float}
        average_confidence is in [0.0, 1.0], averaged across all
        recognized word-level tokens that tesseract reported a confidence
        for. If no text is recognized at all, average_confidence is 0.0.
    """
    processed_bytes = preprocess_image(image_bytes)

    array = np.frombuffer(processed_bytes, dtype=np.uint8)
    img = cv2.imdecode(array, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError("extract_text_from_image could not decode preprocessed image")

    data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)

    words = []
    confidences = []
    for token_text, token_conf in zip(data["text"], data["conf"]):
        token_text = token_text.strip()
        if not token_text:
            continue
        conf_value = float(token_conf)
        if conf_value < 0:
            # tesseract uses -1 for entries with no confidence (e.g. layout
            # blocks/lines rather than actual recognized words)
            continue
        words.append(token_text)
        confidences.append(conf_value)

    full_text = " ".join(words)
    average_confidence = (
        (sum(confidences) / len(confidences)) / 100.0 if confidences else 0.0
    )

    return {"text": full_text, "average_confidence": average_confidence}


def extract_text_from_pdf_page(pdf_path: str, page_num: int) -> dict:
    """
    Rasterize one page of a PDF to an image, then OCR it via the same
    path as extract_text_from_image().

    Args:
        pdf_path: Filesystem path to the PDF.
        page_num: Zero-indexed page number to OCR.

    Returns:
        {"text": str, "average_confidence": float} — same shape as
        extract_text_from_image().

    Raises:
        ValueError: if page_num is out of range for the document.
    """
    import fitz  # PyMuPDF — imported lazily so image-only OCR doesn't require it

    doc = fitz.open(pdf_path)
    try:
        if page_num < 0 or page_num >= doc.page_count:
            raise ValueError(
                f"page_num {page_num} out of range for PDF with {doc.page_count} pages"
            )

        page = doc.load_page(page_num)
        zoom = _PDF_RASTER_DPI / 72  # PDF points are 72 per inch
        matrix = fitz.Matrix(zoom, zoom)
        pixmap = page.get_pixmap(matrix=matrix)
        image_bytes = pixmap.tobytes("png")
    finally:
        doc.close()

    return extract_text_from_image(image_bytes)