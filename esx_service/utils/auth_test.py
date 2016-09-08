import auth
import unittest
import uuid

class AuthTest(unittest.TestCase):
    """ Test authorization """

    def test_authorize_create(self):
        vm_id = str(uuid.uuid4())
        req = auth.AuthorizationRequest(vm_id,
                                            'datastore1',
                                            auth.Operation.create,
                                            {auth.SIZE: '100m'})
        print req.operation
        result = auth.authorize(req)
        if result:
            self.assertIsNotNone(result)


if __name__ == '__main__':
    unittest.main()
