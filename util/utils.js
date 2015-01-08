var validator   = require('validator');
var request     = require('request');
var colors      = require('colors');
var crypto      = require('crypto');
var progressBar = require('progress');
var inquirer    = require('inquirer');
var url         = require('url');
var fs          = require('fs') ;
var _           = require('underscore');

function util(options, messages) {
	this.options   = _.extend(options,messages);
	this._         = _;
	this.validator = validator;
};

/**
* Checks if a given URL is valid syntactically and the that it corresponds to a real web address entity
*
* @method checkValidAddress
* @param {String} question: the prompt you need to send for address entry
* @return {Boolean} Returns true on success
*/

util.prototype.checkValidAddress = function checkValidAddress(question, callback) {

	var util         = this;
	var userAgent    = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.57.2 (KHTML, like Gecko) Version/5.1.7 Safari/534.57.2';

	// Create a new commander interface where we will ask the first questionand then try to validate the URL and the web address
	util.getInput("checkValidAddress" , question , function(URL) {

		// Check if the entry was an "exit" command that will indicate the user quitting the application
		if (!util.checkExitCode(URL)) {
			// Test and validate the URL against a valid syntax
			if (validator.isURL(URL)) {
				// Test that the URL corresonds to a "rea" web entity
				util.checkAddress(URL, function(error, body) {
					if (!error && body ) callback(false, URL, body)
					else {
						util.console("error", "invalidAddress");
						util.checkValidAddress(question, callback);
					}
				});
			} else {
				util.console("error", "invalidURL");
				util.checkValidAddress(question, callback);
			}
		}
	});
}

/**
* Make an http request via request lib to check if the address entered corresponds to a real Web address
*
* @method checkAddress
* @param {String} url: the URL we want to check
* @return {Boolean} Returns true on success
*/

util.prototype.checkAddress = function (url, callback, method) {

	var userAgent    = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.57.2 (KHTML, like Gecko) Version/5.1.7 Safari/534.57.2';

	request({ url : url , method: method || "POST" ,headers : { "User-Agent" : userAgent }},function(error, response, body){
		!error && response.statusCode == 200 ? callback(false, body, response) : callback(true, body, response);
	});
}

/**
* Ask a question in the console and wait for users input
*
* @method checkExitCode
* @param {String} name: the name of the input operation
* @param {String} message: the prompt message to ask the user
* @return {String} Returns the user entry
*/
util.prototype.getInput = function getInput(name, message, callback, condition) {
	// Create a new commander interface where we will ask the first questionand then try to validate the URL and the web address
	inquirer.prompt({  type: "input", name: name , message: message, validate: function( value ) {
		if (value) {
			if (condition) {
				if (value.indexOf(condition) > -1)   return true
					else return "Please enter a valid input";
			} else return true;
		} else return "Please enter a valid input";
	}}, function(answer) {
		callback(answer[name]);
	});
}

/**
* Prompts the user to confirm an action
*
* @method confirm
* @param {String} name: the name of the input operation
* @param {String} message: the prompt message to ask the user
* @return {String} Returns the user entry
*/
util.prototype.confirm = function getInput(name, message, callback) {
	// Create a new commander interface where we will ask the first questionand then try to validate the URL and the web address
	inquirer.prompt({  type: "confirm", name: name , message: message }, function(answer) {
		callback(answer[name]);
	});
}

/**
* Check if the user entered a string that indicates an exit code
*
* @method checkExitCode
* @param {String} code: the manual entry selection for the user input
* @return {Boolean} Returns false or exit application
*/

util.prototype.checkExitCode = function checkExitCode(code) {
	if (code === "exit") process.exit(0)
		else return false;
}

/**
* Download a specified file from a URL using request while showing progress bar
* This function will check if the requested file has been fetched and saved in a cache
* if found, the file will be fetched from the cache, else it will be fetched from the URL
*
* @method downloadWithProgress/download
* @param {Object} cache: The instance of the cache function
* @param {String} filename: The file name to be cached or retreived from cache
* @param {String} url: The URL for the resource to be downloaded
* @param {Function} callback: the function that will get the sucess/fail and result
*/

util.prototype.downloadWithProgress = function downloadWithProgress(cache, fileName, url, callback) {

	var util = this;

	cache.getCache(fileName, function(error, file) {
		if (!error) callback(false, file);
		else {
			// Initialize the request variable and the holders for data and progress bar
			var download = request(url), bar, data = "";
			// The file is downloaded as "chuncks" that will be grouped together
			download.on('data', function(chunk) {
				bar = bar || new progressBar('Downloading... [:bar] :percent :etas', {
					complete: '=', incomplete: ' ', width: 25, total: parseInt(download.response.headers['content-length'])
				});
				// Update the progress bar with the size of the data chunk
				bar.tick(chunk.length);
				// Append the new data "chunk" to the previously download parts
				data += chunk;
			}).on('close', function(err) { bar.tick(bar.total - bar.curr) }).on('end', function() {

				/* The request has finished "end" state, now check the status code
				 * Staus Code 200: resouce has been found and downloaded successfully
				 * Other: resource requested has not been found, or other error occured
				 */

				 if (download.response.statusCode === 200) {
				 	cache.setCache(fileName, data, function(error, success) {
				 		callback(false, JSON.parse(data));
				 	});
				 } else callback(true);
			});
		}
	});
};

util.prototype.download = function download(cache, fileName, url, callback){

	var util = this;

	cache.getCache(fileName, function(error, file) {
		if (!error) callback(false, file);
		else {
			request(url, function(error, response, data){
				if (!error && response.statusCode == 200) {
					cache.setCache(fileName, data , function(error, success){
						callback(false, JSON.parse(data));
					});
				} else callback(true);
			});
		}
	});
};

/**
* Prints a specified system message with the correct color coding
*
* @method promptActionList
* @param {String} type: The type of the options list
* @param {String} name: The name of the list name
* @param {String} message: The question/ message printed before the choices list
* @param {Array} choices: The set of questions i.e. {value: , name:}
* @param {Function} callback: return the user selection to the callee function
* @return {String} The user's selected action from the specified list
*/

util.prototype.promptActionList = function promptActionList(type, name, message, choices, callback) {

	inquirer.prompt([{ type : type, name : name, message: message, choices: choices }], function(answer) {
		callback(answer[name]);
	});
}

/**
* Prints a specified system message with the correct color coding
*
* @method console
* @param {String} type: the type of the printed message that will corresponds to the text color
* @param {String} message: the message printed out to the user
* @return {String} output the desired message color coded in the console
*/

util.prototype.console = function (type, message) {
  colors.setTheme({ info: 'blue', warning: 'magenta', prompt: 'cyan', error: 'red' });
	console.log(colors[type](this.options[type][message]));
}

/**
* Prints a specified system message with the correct color coding
*
* @method console
* @param {String} color: the color of the printed message desired
* @param {String} type: the type of the printed message that will corresponds to the text color
* @param {String} message: the message printed out to the user
* @return {String} output the desired message color coded in the console
*/

util.prototype.colorify = function (color, message, type) {
	if (_.isArray(color) && _.isArray(message) && color.length == message.length) {
		_.each(message, function(message, index){
			type ? process.stdout.write(this.options[type][message][color[index]]) : process.stdout.write(message[color[index]]);
			// Separate the text printed
			process.stdout.write("  ");
		});
		// insert a new line after finishing combining a string
		console.log("");
	} else
			type ? console.log(this.options[type][message][color]) : console.log(message[color]);
}

/**
* Convert string into Camel Case
*
* @method camelCase
* @param {String} input: the string to be camel cased
*/
util.prototype.capitalize = function(input) {
	return input.charAt(0).toUpperCase() + input.slice(1);
}

/**
* Created a dummy string of specific length of a certain character
*
* @method createSeparator
* @param {Integer} length: the length of the string you wish to build
* @param {Character} key: the character you want to have in the string
* @param {Boolean} newline: indicate if we wish to insert a new line after the separator or not
*/
util.prototype.createSeparator = function createSeparator(length, symbol, newline) {
	var string =  Array.apply(null, new Array(length)).map(String.prototype.valueOf,symbol).join("");
	// Check if we wish to insert a newline
	if (newline) string +=  "\n";

	return string
}

/**
* Create a hashed Stringed based on SHA1 crypto algorithm
*
* @method hash
* @param {String} string: the value that needs to be encoded/hashed
* @return {String} Output the SHA1 hash value of a string
*/
util.prototype.hash = function hash(string) {
	return crypto.createHash('sha1').update(string).digest('hex');
}

/**
* Get the base hostname of a URL
*
* @method getPortalName
* @param {String} url: a web address for a resouce
* @return {String} The main hostname of the URL
*/
util.prototype.getPortalName = function getPortalName(address) {
	return url.parse(address).hostname;
}

// Export the Parser constructor from this module.
module.exports = util;
