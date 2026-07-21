import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from Backend.database import get_db
from Backend.auth import get_current_user
from Backend import models
from Backend import schemas
from Backend.services import ml_adapter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/agents", tags=["Specialized AI Agents"])

@router.post("/rca", response_model=schemas.RCAResponse)
def root_cause_analysis(
    request: schemas.RCARequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Fuses work order history, equipment failure records, OEM manuals, and inspection findings
    retrieved from the document corpus to generate predictive maintenance recommendations,
    Root Cause Analysis (RCA) support, and optimized maintenance schedules.
    """
    tag = request.equipment_tag.strip()
    if not tag:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Equipment tag is required.")

    logger.info("Running Root Cause Analysis for asset tag: %s", tag)

    # 1. Query vector database for context relating to this asset tag
    query_str = f"Incident reports, failures, maintenance history, bearing wear, and operational manuals for {tag}"
    try:
        # Fetch matching chunks
        contexts = ml_adapter.query_vector_store(
            query_vector=ml_adapter.embed_text(query_str),
            top_k=8
        )
    except Exception as exc:
        logger.error("Failed to query vector store for RCA context: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving context for Root Cause Analysis."
        )

    if not contexts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No indexed documentation or history records found for equipment tag '{tag}'."
        )

    # 2. Build synthesis prompt for the LLM
    context_blocks = []
    for i, item in enumerate(contexts, 1):
        meta = item.get("metadata") or {}
        filename = meta.get("filename", "Unknown Document")
        page = meta.get("page_number", "?")
        snippet = meta.get("text", "")
        context_blocks.append(f"[{i}] Source: {filename} (Page {page})\n{snippet}")

    context_text = "\n\n".join(context_blocks)
    
    prompt = f"""
You are a Lead Industrial Reliability Engineer. Generate a comprehensive Root Cause Analysis (RCA) and Maintenance Intelligence Report for the asset tagged: **{tag}**.

Use ONLY the retrieved document snippets below as the context for your analysis. Any claims, histories, or recommendations you synthesize MUST cite the source numbers (e.g. [1], [2]).

---
RETRIEVED DOCUMENT CONTEXT:
{context_text}
---

Structure your report in clear, professional markdown containing the following sections:
1. **Asset Identification & Context**: Basic description of the asset based on the documentation.
2. **Failure Analysis & Timeline**: Summarize all reported failure incidents, dates, symptoms (e.g. bearing wear, seal leakage, vibrations), and outcomes.
3. **Root Cause Analysis (RCA)**: Propose a root cause hypothesis (e.g., fatigue, lubrication failure, operating pressure mismatch) with supporting citations.
4. **Maintenance Intelligence Recommendations**: Provide actionable corrective and preventive maintenance actions.
5. **Optimized Maintenance Schedule**: Propose an inspection interval and critical operational thresholds based on the findings.
"""

    try:
        report_markdown = ml_adapter.generate_llm_response(
            prompt=prompt,
            system_prompt="You are a careful technical assistant generating structured RCA reports based on evidence.",
            max_tokens=1500
        )
    except Exception as exc:
        logger.error("LLM execution for RCA failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to generate RCA report using the LLM provider."
        )

    # 3. Create Audit Log
    audit = models.AuditLog(
        user_id=current_user.id,
        action="GENERATE_RCA_REPORT",
        details={"equipment_tag": tag}
    )
    db.add(audit)
    db.commit()

    return {
        "equipment_tag": tag,
        "rca_report": report_markdown
    }

@router.post("/compliance-check", response_model=schemas.ComplianceResponse)
def check_compliance(
    request: schemas.ComplianceRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Maps regulation standards (e.g. Factory Act, OISD) against indexed SOPs,
    equipment states, and inspection records to identify compliance gaps.
    """
    regulation = request.regulation.strip()
    if not regulation:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Regulation name is required.")

    logger.info("Executing Regulatory Compliance check for: %s", regulation)

    # 1. Fetch compliance requirements matching the regulation from the database
    requirements = db.query(models.ComplianceRequirement).filter(
        models.ComplianceRequirement.regulation_type.ilike(f"%{regulation}%")
    ).all()

    # Fallback to standard pre-defined hackathon rules if the database requirements are empty
    if not requirements:
        logger.info("No compliance requirements found in DB. Injecting mock standard constraints for demo.")
        # Setup standard industrial checks
        mock_data = [
            ("Section 21 - Safety Guarding", "Every dangerous part of any machinery must be securely guarded."),
            ("Section 35 - Eye Protection", "Provide suitable goggles or screens if process involves risk to eyes."),
            ("OISD-118 - Fire Protection", "Standard periodic maintenance and hydro-testing of pressure valves and fire response structures.")
        ]
        for title, desc in mock_data:
            req = models.ComplianceRequirement(
                regulation_type=regulation,
                section=title.split(" - ")[0],
                title=title,
                description=desc,
                severity="MANDATORY"
            )
            db.add(req)
        db.commit()
        # Re-fetch
        requirements = db.query(models.ComplianceRequirement).filter(
            models.ComplianceRequirement.regulation_type.ilike(f"%{regulation}%")
        ).all()

    gaps = []
    compliance_statuses = []

    # 2. For each requirement, query vector index to search for evidence/compliance in SOPs and logs
    for req in requirements:
        search_query = f"Operations compliance verification: {req.title} {req.description} inspection safety checks procedures"
        
        try:
            contexts = ml_adapter.query_vector_store(
                query_vector=ml_adapter.embed_text(search_query),
                top_k=4
            )
        except Exception as exc:
            logger.error("Failed to query vector database for compliance: %s", exc)
            continue
            
        context_text = "\n\n".join([item.get("metadata", {}).get("text", "") for item in contexts])
        
        # 3. Use LLM to analyze context against requirement
        analysis_prompt = f"""
Requirement Details:
- Title: {req.title}
- Description: {req.description}

Retrieved Plant Context:
\"\"\"
{context_text}
\"\"\"

Analyze whether the plant conforms to this requirement. Check if there are active inspection records or SOP details confirming safety compliance.
Respond ONLY with a JSON block:
{{
  "status": "COMPLIANT" | "NON_COMPLIANT" | "DEGRADED",
  "evidence": "Brief quotation of evidence from text supporting status",
  "gap_description": "Explanation of what is missing if status is NON_COMPLIANT or DEGRADED, otherwise leave blank"
}}
"""
        try:
            llm_reply = ml_adapter.generate_llm_response(
                prompt=analysis_prompt,
                system_prompt="You are a strict regulatory compliance auditor. Analyze the context and reply with JSON.",
                max_tokens=350
            )
            
            import re
            import json
            json_match = re.search(r"({.*})", llm_reply, re.DOTALL)
            json_str = json_match.group(1).strip() if json_match else llm_reply.strip()
            result = json.loads(json_str)
            
            status_val = result.get("status", "NON_COMPLIANT")
            compliance_statuses.append(status_val)
            
            if status_val in ("NON_COMPLIANT", "DEGRADED"):
                gaps.append(
                    schemas.GapDetail(
                        description=result.get("gap_description") or f"Lack of verification documentation for {req.title}.",
                        severity="High" if status_val == "NON_COMPLIANT" else "Medium",
                        section=req.section
                    )
                )
                
            # Ensure a default asset exists to avoid Not-Null FK violations
            default_asset = db.query(models.Asset).first()
            if not default_asset:
                default_asset = models.Asset(
                    tag="SYSTEM",
                    name="Default System Plant",
                    type="Plant",
                    status="OPERATIONAL"
                )
                db.add(default_asset)
                db.flush()  # populate ID in session

            # Log individual compliance assessment in database
            assessment = models.ComplianceAssessment(
                requirement_id=req.id,
                asset_id=default_asset.id, 
                status=status_val,
                evidence_snippet=result.get("evidence")
            )
            db.add(assessment)
            
        except Exception as exc:
            logger.error("Failed compliance evaluation on %s: %s", req.title, exc)
            compliance_statuses.append("NON_COMPLIANT")
            gaps.append(
                schemas.GapDetail(
                    description=f"Evaluation failed for {req.title} due to system error.",
                    severity="Medium",
                    section=req.section
                )
            )

    # 4. Synthesize final status
    if "NON_COMPLIANT" in compliance_statuses:
        final_status = "NON_COMPLIANT"
    elif "DEGRADED" in compliance_statuses:
        final_status = "DEGRADED"
    else:
        final_status = "COMPLIANT"

    # Create Audit Log
    audit = models.AuditLog(
        user_id=current_user.id,
        action="CHECK_COMPLIANCE",
        details={"regulation": regulation, "status": final_status, "gap_count": len(gaps)}
    )
    db.add(audit)
    db.commit()

    return {
        "regulation": regulation,
        "status": final_status,
        "gaps": gaps
    }
