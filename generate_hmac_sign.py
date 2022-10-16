import base64
import hashlib
import hmac
import time
import urllib.parse

epoch_time = int(time.time())

def get_kraken_signature(urlpath:str, data:dict, secret:str) -> str:
    """ Generate hmac signature of sent payload

    Args:
        urlpath (str): url the message will be sent to (excluding the host/port + base path)
        data (dict): the json which will be sent, in dict format
        secret (str): the API secret generated for us by the target service

    Returns:
        str: the signature
    """

    postdata = urllib.parse.urlencode(data)
    encoded = (str(data["nonce"]) + postdata).encode()
    message = urlpath.encode() + hashlib.sha256(encoded).digest()

    mac = hmac.new(base64.b64decode(secret), message, hashlib.sha512)
    sigdigest = base64.b64encode(mac.digest())
    return sigdigest.decode()


api_sec = "API Secret from your account - to handle as other secrets, no hardcoding"

epoch_time = int(time.time())

data = {"nonce": epoch_time}

signature = get_kraken_signature("/0/private/Balance", data, api_sec)
print(f"nonce: {epoch_time}")
print("API-Sign: {}".format(signature))
