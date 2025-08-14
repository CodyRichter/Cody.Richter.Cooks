

class UnauthorizedException(Exception):
    """Exception raised for unauthorized access."""
    def __init__(self):
        super().__init__("Unauthorized access. Please check your credentials.")