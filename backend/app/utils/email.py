"""
Email service utility for sending emails via Resend.
"""

import resend
from datetime import datetime
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
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    background-color: #f8fafc;
                    margin: 0;
                    padding: 0;
                    color: #1e293b;
                }}
                .container {{
                    max-width: 600px;
                    margin: 40px auto;
                    background: #ffffff;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }}
                .header {{
                    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                    padding: 40px 20px;
                    text-align: center;
                }}
                .header h1 {{
                    color: #ffffff;
                    margin: 0;
                    font-size: 24px;
                    font-weight: 700;
                    letter-spacing: -0.025em;
                }}
                .content {{
                    padding: 40px;
                }}
                .content h2 {{
                    font-size: 20px;
                    font-weight: 600;
                    margin-bottom: 16px;
                    color: #0f172a;
                }}
                .content p {{
                    font-size: 16px;
                    line-height: 1.6;
                    margin-bottom: 24px;
                    color: #475569;
                }}
                .button-container {{
                    text-align: center;
                    margin: 32px 0;
                }}
                .button {{
                    background-color: #4f46e5;
                    color: #ffffff !important;
                    padding: 14px 32px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 16px;
                    display: inline-block;
                    transition: background-color 0.2s;
                }}
                .footer {{
                    background-color: #f1f5f9;
                    padding: 24px;
                    text-align: center;
                    font-size: 14px;
                    color: #64748b;
                }}
                .footer p {{
                    margin: 4px 0;
                }}
                @media (max-width: 600px) {{
                    .container {{
                        margin: 0;
                        border-radius: 0;
                    }}
                    .content {{
                        padding: 24px;
                    }}
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Cody Richter Cooks</h1>
                </div>
                <div class="content">
                    <h2>Reset your password</h2>
                    <p>We received a request to reset the password for your account. If you didn't make this request, you can safely ignore this email.</p>
                    <div class="button-container">
                        <a href="{reset_link}" class="button">Reset Password</a>
                    </div>
                    <p>This link will expire in 15 minutes. For security reasons, it can only be used once.</p>
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; font-size: 14px; color: #6366f1;">{reset_link}</p>
                </div>
                <div class="footer">
                    <p>&copy; {datetime.now().year} Cody Richter Cooks</p>
                    <p>Elevate your kitchen experience.</p>
                </div>
            </div>
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
