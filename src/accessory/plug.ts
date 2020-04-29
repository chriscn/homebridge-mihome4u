import type {CharacteristicGetCallback, CharacteristicSetCallback, CharacteristicValue, PlatformAccessory, Service} from 'homebridge';
import {CharacteristicEventTypes} from 'homebridge';

import {MiHomePlatform} from '../platform';

import axios from 'axios';

export class MiHomePlug {
  private service: Service;

  constructor(
    private readonly platform: MiHomePlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Energinie')
      .setCharacteristic(this.platform.Characteristic.Model, 'Default')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.context.device.label);
    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.Switch) ?? this.accessory.addService(this.platform.Service.Switch);

    // To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
    // when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
    // this.accessory.getService(this.platform.Service.AccessoryInformation.name) ?? this.accessory.addService(this.platform.Service.Switch, 'TEST', 'USER_DEFINED_SUBTYPE');

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    // this.service.setCharacteristic(this.platform.Characteristic.Model, accessory.displayName);

    // each service must implement at-mimimum the "required characteristics" for the given service type
    // see https://github.com/homebridge/HAP-NodeJS/blob/master/src/lib/gen/HomeKit.ts

    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .on(CharacteristicEventTypes.SET, this.setOn.bind(this))                // SET - bind to the `setOn` method below
      .on(CharacteristicEventTypes.GET, this.getOn.bind(this));               // GET - bind to the `getOn` method below
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  setOn(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    // post request to the api
    if (value) {
      axios({
        method: 'post',
        url: this.platform.baseURL + '/api/v1/subdevices/power_on',
        headers: {
          'Content-type': 'application/json',
        },
        data: { id: parseInt(this.accessory.context.device.id) },
        auth: {
          username: this.platform.username,
          password: this.platform.apiKey,
        },
      }).then(res => this.platform.log.debug(res.data)).catch(err => {
        this.platform.log.error(err);
        callback(err);
      });
    } else {
      axios({
        method: 'post',
        url: this.platform.baseURL + '/api/v1/subdevices/power_off',
        headers: {
          'Content-type': 'application/json',
        },
        data: { id: parseInt(this.accessory.context.device.id) },
        auth: {
          username: this.platform.username,
          password: this.platform.apiKey,
        },
      }).then(res => this.platform.log.debug(res.data)).catch(err => {
        this.platform.log.error(err);
        callback(err);
      });
    }
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  getOn(callback: CharacteristicGetCallback) {
    this.platform.log.debug(`getting on for ${this.accessory.displayName} with id ${this.accessory.context.device.id}`);

    axios({
      method: 'post',
      url: this.platform.baseURL + '/api/v1/subdevices/show',
      headers: {
        'Content-type': 'application/json',
      },
      data: { id: parseInt(this.accessory.context.device.id) },
      auth: {
        username: this.platform.username,
        password: this.platform.apiKey,
      },
    }).then(response => {
      this.platform.log.debug(`Got response status ${response.data.status} from id ${this.accessory.context.device.id} with name ${this.accessory.displayName} power state ${response.data.data.power_state}`);
      //  this.platform.log.debug(response.data);
      if (response.data.data.power_state == 1 || response.data.data.power_state == true) {
        callback(null, true);
      } else if (response.data.data.power_state == 0 || response.data.data.power_state == false) {
        callback(null, false);
      } else {
        this.platform.log.info('Non boolean power_state?');
        callback(new Error('non boolean power_state'));
      }
    }).catch(error => {
      this.platform.log.error(`Got an error ${error.response.status} from ${this.accessory.context.device.label} with id ${this.accessory.context.device.id}`);
      //      this.platform.log.error(`Error body ${error.response.data}`);
      callback(error);
    });
  }
}
