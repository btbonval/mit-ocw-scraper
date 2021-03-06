var request = require("request");
var fs = require("fs");
var cheerio = require('cheerio');
var _ = require('underscore');
var JSONArray = [];

// TODO: Create a directory for each course - w/ a file of metadata (uri etc.)
//    A directory for each lecture with the file and the text

var getAllMITCourseLinks = function(callback) { // returns all the course links from the MIT courese page

	var courseLinks = [];

	request({
		uri: "http://ocw.mit.edu/courses/audio-video-courses/"
		}, function(error, response, body) {
			var $ = cheerio.load(body);

			$('.preview').each(function(){
				courseLinks.push('http://ocw.mit.edu/' + this['0'].attribs.href);
			});

			courseLinks = _.uniq(courseLinks); // unique list of all course links
			
			_.each(courseLinks, function(element, index, list) {
				callback(element, callback);
			});
	});

};


var getMITCourseMediaData = function(courseLink, callback) { // returns citation and media links from one coures page
	var videoLink;
	var data = {};
	var mediaData = [];

	request({
		uri: courseLink // get a course page
	}, function(error, response, body) {
		var $ = cheerio.load(body);
		if ($('ul.specialfeatures').text().indexOf('Transcript') != -1) { // does the course have a transcript?

			videoLink = 'http://ocw.mit.edu/' + $('ul.specialfeatures').find('a')["0"].attribs.href;
			citation = $('.citeInner < p').first().text();
			if (videoLink.indexOf('video-lectures') !== -1 || videoLink.indexOf('audio-lectures') !== -1 ) { // if it's a link to many lecture videos get them all
				request({
					uri: videoLink
				}, function(error, response, body){
					var $ = cheerio.load(body);
					var fileName;
					$('a.medialink').each(function () {
						if (this['0'].name === 'a') { // make sure it's a link
							data.lectureLink = 'http://ocw.mit.edu' + this['0'].attribs.href;
							data.citation = citation;
						  data.lecture = this['0'].attribs.href.split('/')[5].split('-').join(' ');
							data.course = this['0'].attribs.href.split('/')[3].split('-').join(' ');
							data.subject = this['0'].attribs.href.split('/')[2].split('-').join(' ');
							mediaData.push(data);
							fileName = data.course + data.lecture + '.JSON';
							fs.writeFileSync(fileName, JSON.stringify(mediaData));
							data = {}
						}
					});
					var obj = fs.readFileSync(fileName, 'utf8');
					_.each(JSON.parse(obj), getMediaAndTranscript);
				});
			};
		}
	});
};

var getMediaAndTranscript = function (object) { // change object back to object
	var json = object
	request({
		uri: json.lectureLink
	}, function(error, response, body) {
		var $ = cheerio.load(body);
		var fileName = object.course + object.lecture + '.JSON'
		if ($('#media_tabs').children().last().children().first().next().next().children().last().children().length > 0) {
			json.mediaLink = 'http://ocw.mit.edu/' + $('#media_tabs').children().last().children().first().next().next().children().last().children()['0'].attribs.href;
			json.srtLink = 'http://ocw.mit.edu/' + $('#media_tabs').children().last().children().last().prev().children().children()['0'].attribs.href;
			var fileName = object.course + object.lecture + '.JSON'
			fs.writeFileSync(fileName, JSON.stringify(json));
		}
	});
};

getAllMITCourseLinks(getMITCourseMediaData);

