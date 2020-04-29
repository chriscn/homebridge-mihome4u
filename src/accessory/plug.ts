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
    this.service.setCharacteristic(this.platform.Characteristic.Model, accessory.displayName);

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

    callback(null);
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

    axios(this.platform.baseURL + `/api/v1/subdevices/show`, {
      method: 'POST',
      auth: {
        username: this.platform.username,
        password: this.platform.apiKey,
      },
      params: {
        id: parseInt(this.accessory.context.device.id),
      },
      responseType: 'json',
    }).then(response => {
      this.platform.log.debug(`Got response status ${response.data.status} from id ${this.accessory.context.device.id}`);
      this.platform.log.debug(response.data.data);
    }).catch(error => {
      this.platform.log.error(`Got an error ${error.response.status} from ${this.accessory.context.device.label} with id ${this.accessory.context.device.id}`);
    });

    // implement your own code to check if the device is on
    // this.exampleStates.On = !this.exampleStates.On;
    // const isOn = this.exampleStates.On;

    //this.platform.log.debug('Get Characteristic On ->', isOn);

    // you must call the callback function
    // the first argument should be null if there were no errors
    // the second argument should be the value to return
    callback(null, false);
  }
}
