const manager = require('./manager');
const servicesMock = [{
    "id": 777,
    "name": "welcome",
    "code": {
        "code": [
            {
                "name": "package.json",
                "code": JSON.stringify({
                    "name": "welcome",
                    "description": "",
                    "template": "",
                    "port": ""
                  })
            },
            {
                "name": ".service.json",
                "code": JSON.stringify({
                    "id": 777,
                    "type": "frontend",
                    "persist": "filesystem",
                    "path": ".welcome",
                    "main": "service.json",
                    "version": 0.4,
                    "tree": null,
                    "files": null
                })
            }
        ],
        "tree": {
            "welcome": {
                "package.json": {},
                ".service.json": {}
            }
        }
    },
    "createdAt": "2020-05-06T07:05:48.158Z",
    "updatedAt": "2020-05-06T07:17:03.925Z"
}];

describe('manager read', () => {
    beforeAll(async () => {
    });

    it('handles services that are persisted through file system', async () => {
        //Arrange
        const handler = manager.handle({
            name: 'read',
            manager: {
                services: servicesMock
            }
        });

        //Act
        const response = await handler({
            id: 777
        });

        //Assert
        const { name, tree, code } = response[0];
        const treeFiles = Object.keys(tree[name]);
        const codeFiles = code.map(x => x.name);
        //console.log(code[0]);
        //console.log(JSON.stringify({ tree, codeFiles }, null, 2));
    });

});