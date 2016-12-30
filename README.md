# audiovk

audio parser build onElectron + local dockerized mongo tools for save results

# dependencies

	npm install && bower install

# build

	electron-packager . audiovk --platform=win32 --arch=x64

where

	platform
	String (default: the arch of the host computer running Node)
	Allowed values: linux, win32, darwin, mas, all

	arch
	String (default: the arch of the host computer running Node)
	Allowed values: ia32, x64, armv7l, all
