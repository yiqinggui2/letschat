exports.genRoomAccessCode = function() {
	var avai_chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var result = '';
	for(var i=0; i<10; i++) {
		result += avai_chars.charAt(Math.floor(Math.random()*10));
	}
	return result;
};