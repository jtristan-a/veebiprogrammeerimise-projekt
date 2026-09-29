const dateET = function(){
	let timeNow = new Date();
	let dateNow = timeNow.getDate();
	let monthNow = timeNow.getMonth();
	let yearNow = timeNow.getFullYear();
	let dayNow = timeNow.getDay();
	const monthNamesET = ['jaanuar', 'veebruar', 'märts', 'aprill', 'mai', 'juuni', 'juuli', 'august', 'september', 'oktoober', 'november', 'detsember']
	const dayNamesET = ['puhapaev', 'esmaspaev', 'teisipaev', 'kolmapaev', 'neljapaev', 'reede', 'laupaev']
	return dayNamesET[dayNow] + ' ' + dateNow + '.' + monthNamesET[monthNow] + ' ' + yearNow;
}

const addLeadZero = function(numValue){
	if(numValue < 10){
		numValue = '0' + numValue;
	}
	return numValue;
}

const timeFormattedET = function(){
	let timeNow = new Date();
	let hourNow = timeNow.getHours();
	let minuteNow = timeNow.getMinutes();
	let secondsNow = timeNow.getSeconds();
	let timeFormatted = hourNow + ':' + addLeadZero(minuteNow) + ':' + addLeadZero(secondsNow);
	return timeFormatted
}
	
	
	module.exports = {time: timeFormattedET, date: dateET};
