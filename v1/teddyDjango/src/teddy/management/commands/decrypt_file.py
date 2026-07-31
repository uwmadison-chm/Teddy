from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from teddy.models import AppSession
import os
from virgil_crypto import VirgilCrypto
import base64
from virgil_crypto.keys.key_pair_type import KeyPairType
import zipfile
from multiprocessing import Pool
import time
import math

crypto = VirgilCrypto()



def decrypt_file(path, private_key):
    if not os.path.exists(path):
        return 0

    decrypted_path = path.replace(".enc", "")
    if os.path.exists(decrypted_path):
        return 0
    print("Decrypting file to path:", decrypted_path)
    with open(path, 'rb') as infile:
        with open(decrypted_path+".zip", "wb") as outfile:
            outfile.write(crypto.decrypt(infile.read(), private_key))

    try:
        with zipfile.ZipFile(decrypted_path+".zip", "r") as f:
            zipinfos = f.infolist()
            zipinfos[0].filename = os.path.basename(decrypted_path)
            f.extract(zipinfos[0], os.path.dirname(decrypted_path))
            # print("zip file contents", f.namelist())
            os.remove(decrypted_path + ".zip")
    except zipfile.BadZipFile:
        os.rename(decrypted_path+".zip", decrypted_path)

    print("Decrypted file to", decrypted_path)

    return 1


class Command(BaseCommand):
    help = "Decrypts the given file"

    def add_arguments(self, parser):
        parser.add_argument('--file', type=str, required=False)


    def handle(self, *args, **options):

        with open(os.path.join(settings.BASE_DIR, "..", "encryptionkeys", "private_key.dem")) as keyfile:
            private_key = keyfile.read()
        private_key = crypto.import_private_key(base64.b64decode(private_key)).private_key

        decrypt_file(options['file'], private_key)

