import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import cv2
import numpy as np
from services.ocr import extract_text_from_image, preprocess_image


#  both test images are generated synthetically with OpenCV rather than loaded from disk.
# "Clean" = sharp black text on a white background, unrotated.
# "Blurry" = the same text, heavily blurred and rotated ~12 degrees, to
# simulate a poorly-photographed inspection report page.
_TEST_TEXT = "OPERATIONS BRAIN TEST"


def _render_text_image(text: str, size: tuple[int, int] = (900, 220)) -> np.ndarray:
    canvas = np.full((size[1], size[0]), 255, dtype=np.uint8)
    cv2.putText(
        canvas,
        text,
        (30, 130),
        cv2.FONT_HERSHEY_SIMPLEX,
        2.0,
        color=0,
        thickness=4,
        lineType=cv2.LINE_AA,
    )
    return canvas


def _make_clean_image_bytes() -> bytes:
    img = _render_text_image(_TEST_TEXT)
    success, encoded = cv2.imencode(".png", img)
    assert success, "failed to encode synthetic clean test image"
    return encoded.tobytes()


def _make_blurry_rotated_image_bytes() -> bytes:
    img = _render_text_image(_TEST_TEXT)

    # Heavy blur to destroy sharp edges tesseract relies on.
    img = cv2.GaussianBlur(img, (17, 17), sigmaX=7)

    # Rotate 20 degrees to also exercise the deskew path.
    height, width = img.shape[:2]
    center = (width // 2, height // 2)
    matrix = cv2.getRotationMatrix2D(center, 20, 1.0)
    img = cv2.warpAffine(
        img, matrix, (width, height), borderMode=cv2.BORDER_CONSTANT, borderValue=255
    )

    success, encoded = cv2.imencode(".png", img)
    assert success, "failed to encode synthetic blurry test image"
    return encoded.tobytes()


def test_preprocess_image_returns_decodable_png():
    processed = preprocess_image(_make_clean_image_bytes())
    array = np.frombuffer(processed, dtype=np.uint8)
    decoded = cv2.imdecode(array, cv2.IMREAD_GRAYSCALE)
    assert decoded is not None
    assert decoded.shape[0] > 0 and decoded.shape[1] > 0


def test_preprocess_image_rejects_empty_bytes():
    try:
        preprocess_image(b"")
        raised = False
    except ValueError:
        raised = True
    assert raised, "Expected preprocess_image(b'') to raise ValueError"


def test_clean_image_produces_nonempty_text():
    result = extract_text_from_image(_make_clean_image_bytes())
    assert result["text"].strip() != "", "Expected non-empty text from clean image"
    assert 0.0 <= result["average_confidence"] <= 1.0


def test_clean_image_confidence_meaningfully_higher_than_blurry():
    clean_result = extract_text_from_image(_make_clean_image_bytes())
    blurry_result = extract_text_from_image(_make_blurry_rotated_image_bytes())

    assert 0.0 <= blurry_result["average_confidence"] <= 1.0

    margin = clean_result["average_confidence"] - blurry_result["average_confidence"]
    assert margin > 0.15, (
        f"Expected clean image confidence to be meaningfully higher than blurry "
        f"(clean={clean_result['average_confidence']:.3f}, "
        f"blurry={blurry_result['average_confidence']:.3f}, margin={margin:.3f})"
    )


if __name__ == "__main__":
    test_preprocess_image_returns_decodable_png()
    test_preprocess_image_rejects_empty_bytes()
    test_clean_image_produces_nonempty_text()
    test_clean_image_confidence_meaningfully_higher_than_blurry()
    print("All tests passed.")
