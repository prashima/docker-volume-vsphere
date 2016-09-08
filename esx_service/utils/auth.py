import random

# Option keys
SIZE = 'size'

# No native enums in python 2 :(
class Operation:
    create = "create"
    remove = "remove"
    list = "list"
    get = "get"
    attach = "attach"
    detach = "detach"


class AuthorizationRequest:
    def __init__(self, vm_uuid, datastore, operation, opts=None):
        self.vm_id = vm_uuid
        self.datastore = datastore
        self.operation = operation
        self.opts = opts

def authorize(auth_request):
   random.choice([None, 'Some error msg'])
