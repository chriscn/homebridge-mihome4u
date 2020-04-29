import type {API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig} from 'homebridge';
import {APIEvent} from 'homebridge';

import {PLATFORM_NAME, PLUGIN_NAME} from './settings';

import {MiHomePlug} from './accessory/plug';

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
  public baseURL: string; // should usually be https://mihome4u.co.uk
  public apiKey = '';

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.platform);
    this.log.debug(`Found config with username ${this.config.username} and password ${this.config.password}`);

    this.username = this.config.username;
    this.baseURL = this.config.baseURL || 'https://mihome4u.co.uk';


    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on(APIEvent.DID_FINISH_LAUNCHING, async () => {
      this.log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories

      await this.authentication(); // get apiKey from MiHome to use instead of password.

      this.discoverDevices();
    });
  }

  async authentication() {
    await axios(this.baseURL + '/api/v1/users/profile', {
      method: 'GET',
      auth: {
        username: this.username,
        password: this.config.password,
      },
      responseType: 'json',
    }).then(response => {
      if (response.data.status == 'success') {
        if (response.data.data.api_key == undefined || response.data.data.api_key == '') {
          this.log.error('APIKey was undefined or empty, may be a weird bug. Please report this.');
          this.log.error(`Error Message: ${response.data.data.message}`);
        } else {
          this.apiKey = response.data.data.api_key.toString();
          this.log.info(`Successfully authenticated with username (${this.username}) and got APIKEY (${this.apiKey})`);
        }
      } else {
        this.log.error(`Non Success status code, expected success got '${response.data.status}'`);
        // should disable the plugin
      }
    }).catch(error => {
      this.log.error(error);
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    if (accessory.context.device.device_type.toLowerCase() == "control") {
      this.log.info('Restoring accessory from cache:', accessory.displayName);
      new MiHomePlug(this, accessory);
      this.accessories.push(accessory);
    } else {
      this.log.info(`Unknown device found in cache with type ${accessory.context.device.device}`);
    }
  }

  removeAccessory(accessory: PlatformAccessory) {

  }

  // calls the api to get a list of all the subdevices
  discoverDevices() {
    axios(this.baseURL + '/api/v1/subdevices/list', {
      method: 'GET',
      auth: {
        username: this.username,
        password: this.apiKey,
      },
      responseType: 'json',
    }).then(response => {
      this.log.debug('Adding subdevices');
      const data = response.data.data;

      if (response.data.status == 'success') {
        for (const device of data) {
          const uuid = this.api.hap.uuid.generate(device.id.toString());
          const friendlyName: string = this.toTitleCase(
            device.label.match(/(?:\d{3}-\d{2} )?([\w -]+)/)[1] || device.label,
          ); // cleans up the name to be more homekit elagant

          if (!this.accessories.find(accessory => accessory.UUID === uuid)) {
            this.log.info(`Registering new accessory with name ${friendlyName} with id ${device.id}`);

            const accessory = new this.api.platformAccessory(friendlyName, uuid);
            accessory.context.device = device;

            switch (device.device_type.toString().toLowerCase()) {
              case 'control':
                new MiHomePlug(this, accessory);
                this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
                this.accessories.push(accessory);
                break;
              default:
                this.log.info(`Unknown device type of ${device.device_type}, not adding. ` +
                'Please report this is that in future we can add it!');
            }
          }
        }
      } else {
        this.log.error(`Non success response type got response: ${response.data.status}`);
      }
    }).catch(error => {
      this.log.error(error);
    });
  }

  toTitleCase = (phrase: string) => {
    return phrase
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace('Lhs', 'LHS') // LHS should be in all capitals standing for Left hand side
      .replace('Rhs', 'RHS')
      .replace('Tv', 'TV')
      .trim();
  };
}

export interface MiHomeAccessory {
  id: number;
  label: string;
  device_id: number;
  power_state: boolean; // is a number in api call should convert
  device_type: DeviceType;
  voltage: number;
  frequency: number;
}

export enum DeviceType {
  CONTROL = 'control',
  LEGACY = 'legacy',
  UNKNOWN = "unkown"
}
