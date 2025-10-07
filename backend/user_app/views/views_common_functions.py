# General functions which will be used in many views 

# Function to convert bonus amount 
def percent_function(a,b):
    divided_amount = a/100
    return divided_amount * b


# Function of Converting data in Million, Kilo
def convert_userdata_in_MK(a):
    if a > 10000 and a < 1000000:
        converted_data = a / 1000
        round_data = round(converted_data,2)
        b = f"{round_data} K"
    elif a > 1000000 and a < 1000000000:
        converted_data = a / 1000000
        round_data = round(converted_data,2)
        b = f"{round_data} M"
    elif a > 1000000000:
        converted_data = a / 1000000000
        round_data = round(converted_data,2)
        b = f"{round_data} B"
    else:
        b = round(a,2)
    return (b)
