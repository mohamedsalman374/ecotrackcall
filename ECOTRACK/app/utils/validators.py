def validate_numeric(value, min_val=0, max_val=None, default=0.0):
    """
    Validates that a value is numeric and falls within optional bounds.
    Returns the parsed float or the default value if invalid.
    """
    try:
        if value is None or value == "":
            return default
            
        float_val = float(value)
        
        if min_val is not None and float_val < min_val:
            return default
            
        if max_val is not None and float_val > max_val:
            return default
            
        return float_val
    except (ValueError, TypeError):
        return default

def validate_choice(value, valid_choices, default):
    """
    Validates that a value exists in a set of allowed choices.
    Returns the choice or the default value if invalid.
    """
    if value in valid_choices:
        return value
    return default
