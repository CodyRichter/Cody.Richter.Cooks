import secrets
import string


class SecureIDGenerator:
    """
    Generates secure, non-sequential string IDs for database objects.
    Format: <TYPE>-<XXXXX>-<XXXXX> where X are alphanumeric characters (0-9, A-Z)

    Uses cryptographically secure random generation with extremely low collision probability.
    With 36^10 possible combinations per type (over 3.6 quadrillion), collisions are virtually impossible.
    """

    # Valid characters for ID generation (0-9, A-Z)
    VALID_CHARS = string.digits + string.ascii_uppercase

    @classmethod
    def generate_id(cls, prefix: str) -> str:
        """
        Generate a secure database ID with a given prefix

        Args:
            prefix: The prefix of the generated ID (i.e. REC, ING, etc...)

        Returns:
            A secure ID string

        Raises:
            ValueError: If object_type is not supported
        """

        # Generate two 5-character segments using cryptographically secure random
        segment1 = "".join(secrets.choice(cls.VALID_CHARS) for _ in range(5))
        segment2 = "".join(secrets.choice(cls.VALID_CHARS) for _ in range(5))

        return f"{prefix}-{segment1}-{segment2}"
