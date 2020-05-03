import {MiHomeAccessory} from './MiHomeAccessory';
import {MiHomePlatform} from '../platform';
import {PlatformAccessory} from 'homebridge';

export class Plug extends MiHomeAccessory {
    constructor(
      private readonly platform: MiHomePlatform,
      private readonly accessory: PlatformAccessory,
    ) {
      super(platform, accessory);

      this.platform.log.debug(`Registered Plug with name ${this.accessory.displayName}`);

      this.service = this.accessory.getService(this.platform.Service.Outlet) ?? this.accessory.addService(this.platform.Service.Outlet, this.accessory.displayName);

    }
}
