from virgil_crypto import VirgilCrypto
import base64, ssl
from virgil_crypto.keys.key_pair_type import KeyPairType
from django.core.management.base import BaseCommand, CommandError

crypto = VirgilCrypto()

class Command(BaseCommand):
    help = "Generates keypairs to use with the app"

    def handle(self, *args, **options):

        # generate a Key Pair
        key_pair = crypto.generate_key_pair(KeyPairType.RSA_2048)

        # export a Private key
        private_key_data = crypto.export_private_key(key_pair.private_key)

        print("Private Certificate in DEM format:")

        print(str(base64.b64encode(private_key_data).decode('UTF-8')))

        print()

        # export a Public key
        public_key_data = crypto.export_public_key(key_pair.public_key)

        print("Public Certificate in DEM format:")

        print(str(base64.b64encode(public_key_data).decode('UTF-8')))

        print()

        cert_PEM = ssl.DER_cert_to_PEM_cert(private_key_data)

        print("Private Certificate in PEM format:")

        print(cert_PEM)

        print()

        cert_PEM = ssl.DER_cert_to_PEM_cert(public_key_data)

        print("Public Certificate in PEM format:")

        print(cert_PEM)
