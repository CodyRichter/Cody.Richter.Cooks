import uuid

# When given an object and a list of keys, confirm that the
# nested keys are present and not None
# If any of the keys are not present or the object is undefined, return False
def is_defined(element, keys: list[str]):
    if element is None:
        return False
    
    for key in keys:
        if key not in element or element[key] is None:
            return False
        element = element[key]
        
    return True


# Generate a UUIDv4 ID for a new object
def generate_id():
    return str(uuid.uuid4())