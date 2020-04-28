import { CharacteristicEventTypes } from 'homebridge';
import type { Service, PlatformAccessory, CharacteristicValue, CharacteristicSetCallback, CharacteristicGetCallback} from 'homebridge';

import axios from 'axios';

import { HomebridgeMiHomePlatform } from '../platform';

export class MiHomePlug {
	private service: Service;

	constructor(
		private readonly platform: HomebridgeMiHomePlatform,
		private readonly accessory: PlatformAccessory,
		private readonly username: String,
		private readonly api_key: String,
		private readonly id: String,
	) {
		let plugType: String;

		axios.get({
			method: 'get',
			url: 'https://mihome4u.co.uk/api/v1/subdevices/show',
			auth: {
				username: this.username,
				password: this.api_key
			},
			responseType: 'json'
		}).then(res => {

		})

		this.accessory.getService(this.platform.Service.AccessoryInformation)!
			.setCharacteristic(this.platform.Characteristic.Manufacturer, 'Energinie')
			.setCharacteristic(this.platform.Characteristic.Model, )

	}
}
