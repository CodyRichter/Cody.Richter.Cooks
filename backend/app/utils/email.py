"""
Email service utility for sending emails via Resend.
"""

import resend
from app.core.config import settings

resend.api_key = settings.resend_api_key


class EmailService:
    @staticmethod
    def send_password_reset_email(to_email: str, reset_link: str) -> bool:
        """
        Sends a password reset email to the user.
        """
        if not settings.resend_api_key:
            print(
                f"[EmailService] Missing RESEND_API_KEY. Would have sent reset email to {to_email} with link: {reset_link}"
            )
            return True

        html_content = f"""
        <html>
            <body>
                <h2>Password Reset Request</h2>
                <p>We received a request to reset your password for Cody Richter Cooks.</p>
                <p>Click the link below to choose a new password. This link will expire in 15 minutes.</p>
                <p><a href="{reset_link}">Reset Password</a></p>
                <p>If you did not request this, you can safely ignore this email.</p>
            </body>
        </html>
        """

        try:
            resend.Emails.send(
                {
                    "from": settings.email_from_address,
                    "to": to_email,
                    "subject": "Password Reset for Cody Richter Cooks",
                    "html": html_content,
                }
            )
            return True
        except Exception as e:
            print(f"[EmailService] Failed to send email: {e}")
            return False
