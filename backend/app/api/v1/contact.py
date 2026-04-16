from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import logging
import boto3
from botocore.exceptions import ClientError
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    company: str | None = None
    message: str

@router.post("/", status_code=201)
async def submit_contact(request: ContactRequest):
    """
    Handle contact form submissions from the marketing site by sending an email via AWS SES.
    """
    logger.info(f"New contact request from {request.name} ({request.email})")
    
    ses = boto3.client("ses", region_name=settings.AWS_REGION)
    
    email_content = f"""
    New Inquiry from Smaatech Engineering Website
    
    Name: {request.name}
    Email: {request.email}
    Company: {request.company or 'N/A'}
    
    Message:
    {request.message}
    """
    
    try:
        ses.send_email(
            Source=settings.CONTACT_RECIPIENT_EMAIL, # Must be a verified identity in SES
            Destination={"ToAddresses": [settings.CONTACT_RECIPIENT_EMAIL]},
            Message={
                "Subject": {"Data": f"New Engineering Inquiry: {request.name}"},
                "Body": {"Text": {"Data": email_content}},
            },
        )
        logger.info("Email sent successfully via SES")
    except ClientError as e:
        logger.error(f"Failed to send email via SES: {e.response['Error']['Message']}")
        # We return success to the user anyway but log the internal failure
    
    return {
        "status": "success",
        "message": "Transmission received. Our engineering leads will coordinate a briefing."
    }
