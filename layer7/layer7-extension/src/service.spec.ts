const proxyquire =  require('proxyquire').noCallThru();
import Sinon from "sinon";
import url from "url";
import { ConfigKeys } from "../types";
const testSwagger = require('../test/testSwagger.json');
const testOas3 = require('../test/testOas3.json');
const testOas3MultipleServers = require('../test/testOas3MultipleServers.json');
const testOas3NoServers = require('../test/testOas3NoServers.json');

// TODO: Fix tsconfig
describe("Layer7 service", () => {
  const sandbox = Sinon.createSandbox();
  let commitToFs: SinonStub = sandbox.stub();
  let processStub: SinonStub;
  let consoleStub: SinonStub;
  let writeSpecification: SinonStub;
	let getPage: SinonStub;
	let login: SinonStub;
  let clientRead: SinonStub;
  let peek: SinonStub;
  let writeAPI4Central: SinonStub;
  let requestPromise: SinonStub;

  let proxyConfig:any = {
		values: {}
  };
  
  let Service = proxyquire('./service', {
    '@axway/amplify-cli-utils': {
			loadConfig: () => (proxyConfig)
		}
  });

  const okConfig: { [key in ConfigKeys]?: string } = {
    clientId: 'someclientid',
    clientSecret: 'someclientsecret',
    baseUrl: 'https://myhost.com:9443/mybasepath',
		webhookUrl: 'https://mywebhook.com',
		environmentName: 'myenvironment'
	}
	
	const okMeta = {
		uuid: 'someuuid',
		name: 'somename',
		portalStatus: 'ENABLED',
		version: '2.0.0',
		ssgUrl: '/apim',
		authenticationParameters: 'Use api key',
		authenticationType: 'APIKEY',
		__assetType: 'WSDL',
		__fileName: 'test.wsdl'
	}

	beforeEach(() => {
		login = sandbox.stub(Service.prototype, 'login');
		login.resolves();
	})
  afterEach(() => {
    sandbox.restore();
    proxyConfig.values = {};
  });

  it('init: should exit if required configurations are not provided', async () => {
    //@ts-ignore
    processStub = sandbox.stub(process, 'exit');
    consoleStub = sandbox.stub(console, 'log');
		new Service({ baseUrl: 'https://myhost:9443/mybasepath' });
    expect(processStub.callCount).to.equal(1);
    expect(consoleStub.firstCall.args[0].startsWith('Missing required config')).to.be.true;
  });

  it('init: should not exit if all required configurations are provided', async () => {
    processStub = sandbox.stub(process, 'exit');
    consoleStub = sandbox.stub(console, 'log');
  
    new Service(okConfig)
    expect(processStub.callCount).to.equal(0);
  });

  it('init: construct class ok & sets proxy properties', () => {
		processStub = sandbox.stub(process, 'exit');
		consoleStub = sandbox.stub(console, 'log');
		proxyConfig.values = {
			network: {
        httpProxy: "http://127.0.0.1", 
        strictSSL: false
			}
		}
		new Service(okConfig);
	
		expect(consoleStub.firstCall.args[0].startsWith('Connecting using proxy settings')).to.be.true;
  });

  it('init: construct class exit if proxy is wrong', () => {
		consoleStub = sandbox.stub(console, 'log');
		processStub = sandbox.stub(process, 'exit');
		proxyConfig.values = {
			network: {
				httpProxy: "notAURL",
			}
    }
    try {
      new Service(okConfig);
    } catch (error) {
			expect(error.message.startsWith('Could not parse')).to.equal(true)
			expect(processStub.callCount).to.equal(1);
    }		
  });

  it('generateResources: calls getPage', async () => {
    getPage = sandbox.stub(Service.prototype, 'getPage');
		getPage.resolves();

    const svc = new Service({
      ...okConfig
    });
    await svc.generateResources()
    expect(getPage.callCount).to.equal(1);
	})
	
	it('generateResources: validate OAS, calls writeAPI4Central', async () => {
    // TODO: generateResources
	})
	
	it('generateResources: suppress OAS 3.0.5 error', async () => {
    // TODO: generateResources
	})
	
	it('generateResources: SOAP, calls writeAPI4Central', async () => {
    // TODO: generateResources
	})
	
	it('generateResources: WADL, calls writeAPI4Central', async () => {
    // TODO: generateResources
  })

  it('getPage: Calls read', async () => {
    const svc = new Service(okConfig);

		clientRead = sandbox.stub(svc, 'read');
		clientRead.resolves({});
    
    await svc.generateResources()
    expect(clientRead.callCount).to.equal(1);
  });

  it('getPage: throw if there is a problem fetching a page', async () => {
    const svc = new Service({
      ...okConfig
    });

    clientRead = sandbox.stub(svc, 'read').rejects(new Error('some error'))
    try {
      await svc.generateResources()
    } catch (error) {
      expect(error.message).to.equal('some error')
    }
	});
	
	it('getPage: gets WSDL, WADL, OAS via assets, return definitions', () => {
		//TODO: getPage
	})

	it('getPage: gets WSDL, WADL, OAS via speccontent, return definitions', () => {
		//TODO: getPage
	})

	it('getPage: no apis', () => {
		//TODO: getPage
	})

	it('getPage: no assets', () => {
		//TODO: getPage
	})

	it('getPage: no speccontent', () => {
		//TODO: getPage
	})

  it('peek: return definition if yml is likely spec and name undefined', async () => {
    const svc = new Service({
      ...okConfig
    });
    const isOAS = svc['peek'](undefined, "swagger: '2.0'")
    expect(typeof isOAS).to.equal('object')
	})
	
	it('peek: return definition if yml is likely spec', async () => {
    const svc = new Service({
      ...okConfig
    });
    const isOAS = svc['peek']('petstore.yml', "swagger: '2.0'")
    expect(typeof isOAS).to.equal('object')
  })

  it('peek: true if json is likely spec', async () => {
    const svc = new Service({
      ...okConfig
    });
    const isOAS = svc['peek']('petstore.json', JSON.stringify({ swagger: '2.0' }))
    expect(typeof isOAS).to.equal('object')
  })

  it('peek: false if name is not yaml/yml/json', async () => {
    const svc = new Service({
      ...okConfig
    });
    const isOAS = svc['peek']('petstore', '')
    expect(isOAS).to.equal(false)
  })

  it('peek: false if object does have swagger/openapi prop', async () => {
    const svc = new Service({
      ...okConfig
    });
    const isOAS = svc['peek']('petstore.json', '{}')
    expect(isOAS).to.equal(false)
  })

  it('writeAPI4Central', async () => {
    commitToFs = sandbox.stub()
    let Stubbed = proxyquire('./service', {
      './utils': {
        isOASExtension: () => true,
        commitToFs,
        getIconData: () => ''
      }
    });
    const svc = new Stubbed({
      ...okConfig
    });
		
		await svc.writeAPI4Central(okMeta, testSwagger);
		expect(commitToFs.callCount).to.equal(1);
		expect(commitToFs.lastCall.args[0].kind).to.equal('ConsumerInstance');
		expect(commitToFs.lastCall.args[1]).to.equal(undefined);
		expect(commitToFs.lastCall.args[2].length).to.equal(4);
	});

	it('writeAPI4Central: oas3', async () => {
    commitToFs = sandbox.stub()
    let Stubbed = proxyquire('./service', {
      './utils': {
        isOASExtension: () => true,
        commitToFs,
        getIconData: () => ''
      }
    });
    const svc = new Stubbed({
      ...okConfig
		});
		
		const parsed = new url.URL(okConfig?.baseUrl || '');
	
		await svc.writeAPI4Central(okMeta, testOas3);
		expect(commitToFs.callCount).to.equal(1);
		expect(commitToFs.lastCall.args[0].kind).to.equal('ConsumerInstance');
		expect(commitToFs.lastCall.args[1]).to.equal(undefined);	
		expect(commitToFs.lastCall.args[2].length).to.equal(4);
		expect(commitToFs.lastCall.args[2][2].spec.endpoint[0].host).to.equal(parsed.hostname);
		expect(commitToFs.lastCall.args[2][2].spec.endpoint[0].protocol).to.equal(parsed.protocol.replace(':', ''));
		expect(commitToFs.lastCall.args[2][2].spec.endpoint[0].routing.basePath).to.equal(okMeta.ssgUrl);
	});

	it('writeAPI4Central: oas3 with multiple servers', async () => {
		commitToFs = sandbox.stub()
    let Stubbed = proxyquire('./service', {
      './utils': {
        isOASExtension: () => true,
        commitToFs,
        getIconData: () => ''
      }
    });
    const svc = new Stubbed({
      ...okConfig
		});

		const parsed = new url.URL(okConfig?.baseUrl || '');
		const proto = parsed.protocol.replace(':', '');

		await svc.writeAPI4Central({
			...okMeta,
			__assetType: undefined
		}, testOas3MultipleServers);
		expect(commitToFs.callCount).to.equal(1);
		expect(commitToFs.lastCall.args[0].kind).to.equal('ConsumerInstance');
		expect(commitToFs.lastCall.args[1]).to.equal(undefined);	
		expect(commitToFs.lastCall.args[2].length).to.equal(4);
		expect(commitToFs.lastCall.args[2][2].spec.endpoint[0].host).to.equal(parsed.hostname);
		expect(commitToFs.lastCall.args[2][2].spec.endpoint[0].protocol).to.equal(proto);
		expect(commitToFs.lastCall.args[2][2].spec.endpoint[0].routing.basePath).to.equal(okMeta.ssgUrl);

		expect(commitToFs.lastCall.args[2][2].spec.endpoint[1].host).to.equal(parsed.hostname);
		expect(commitToFs.lastCall.args[2][2].spec.endpoint[1].protocol).to.equal(proto);
		expect(commitToFs.lastCall.args[2][2].spec.endpoint[1].port).to.equal(9443);
		expect(commitToFs.lastCall.args[2][2].spec.endpoint[1].routing.basePath).to.equal(okMeta.ssgUrl);

		expect(commitToFs.lastCall.args[2][2].spec.endpoint[2].host).to.equal(parsed.hostname);
		expect(commitToFs.lastCall.args[2][2].spec.endpoint[2].protocol).to.equal(proto);
		expect(commitToFs.lastCall.args[2][2].spec.endpoint[2].routing.basePath).to.eq(okMeta.ssgUrl);
	});

	it('writeAPI4Central: oas3 with no servers', async () => {
    commitToFs = sandbox.stub()
    let Stubbed = proxyquire('./service', {
      './utils': {
        isOASExtension: () => true,
        commitToFs,
        getIconData: () => ''
      }
    });
    const svc = new Stubbed({
      ...okConfig
    });
		await svc.writeAPI4Central({
			...okMeta,
			__assetType: undefined
		}, testOas3NoServers);
		expect(commitToFs.callCount).to.equal(1);
		expect(commitToFs.lastCall.args[0].kind).to.equal('ConsumerInstance');
		expect(commitToFs.lastCall.args[1]).to.equal(undefined);	
		expect(commitToFs.lastCall.args[2].length).to.equal(4);
		expect(commitToFs.lastCall.args[2][2].spec.endpoint.length).to.equal(0);
	});

	it('login: sets access_token', () => {
		// TODO: login
	})

	it('login: throw on err', () => {
		// TODO: login
	})

	it('read: calls request promise with params', () => {
		// TODO: read
	})
});