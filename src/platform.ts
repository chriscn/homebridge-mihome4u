import { APIEvent } from 'homebridge';
import type { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { ExampleAccessory } from './accessory/example';

import { MiHomePlug } from './accessory/plug';

import axios from 'axios';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class MiHomePlatform implements DynamicPlatformPlugin {
  public readonly Service = this.api.hap.Service;
  public readonly Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  public username: string;
  public base_url: string; // should usually be https://mihome4u.co.uk
  public api_key: string | undefined;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.platform);
    this.log.debug(`Found config with username ${this.config.username} and password ${this.config.password}`);

    this.username = this.config.username;
    this.base_url = this.config.baseURL || "https://mihome4u.co.uk";

    axios(this.base_url + '/api/v1/users/profile', {
    	method: "GET",
	    auth: {
    		username: this.username,
		    password: this.config.password
	    },
	    responseType: "json"
    }).then(response => {
    	if (response.data.status == "success") {
		    if (response.data.data.api_key == undefined || response.data.data.api_key == "") {
			    this.log.error(`APIKey was undefined or empty, may be a weird bug. Please report this.`)
			    this.log.error(`Error Message: ${response.data.data.message}`);
		    } else {
			    this.api_key = response.data.data.api_key.toString();
			    this.log.info(`Successfully authenticated with username (${this.username}) and got APIKEY (${this.api_key})`)
		    }
	    } else {
			this.log.error(`Non Success status code, expected sucess got '${response.data.status}'`);
	        // should disable the plugin
    	}
    }).catch(error => {
    	this.log.error(error);
    });

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Restoring accessory from cache:', accessory.displayName);

    // create the accessory handler
    // this is imported from `example.ts`
    new ExampleAccessory(this, accessory);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {



  }
}
