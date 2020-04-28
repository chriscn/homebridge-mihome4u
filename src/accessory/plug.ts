import { CharacteristicEventTypes } from 'homebridge';
import type { Service, PlatformAccessory, CharacteristicValue, CharacteristicSetCallback, CharacteristicGetCallback} from 'homebridge';

import axios from 'axios';

import { MiHomePlatform } from '../platform';

export class MiHomePlug {
	private service: Service;

	constructor(
		private readonly platform: MiHomePlatform,
		private readonly accessory: PlatformAccessory,
		private readonly username: string,
		private readonly api_key: string,
		private readonly id: string,
	) {
		this.accessory.getService(this.platform.Service.AccessoryInformation)!
			.setCharacteristic(this.platform.Characteristic.Manufacturer, 'Energinie')
			.setCharacteristic(this.platform.Characteristic.Model, "Default")
			.setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');


		this.service = this.accessory.getService(this.platform.Service.Switch) ?? this.accessory.addService(this.platform.Service.Lightbulb);
	}
}
