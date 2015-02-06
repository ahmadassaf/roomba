var inquirer = require('inquirer');

var separator = new inquirer.Separator();

var messages =   {
	"en": {
		"error" : {
				"unKnownError"          : "An unknown Error occurred .. ",
				"CKANAPIError"					: "The Address Specified doesn't reflect a valid API",
				"invalidURL"            : "The Address entered is not valid URL (Please check for missing http:// before the address)",
				"invalidAddress"        : "The Address entered is not found in the Web, please try again: ",
				"portalCheckFailed"     : "We couldn't identify the type of this data portal :(",
				"actionListError"       : "The last request was not carried out successfully. Please try again",
				"CKANDataListFetchError": "An Error Occurred while trying to fetch the datasets list from the CKAN repository",
				"invalidAPIResult"      : "This function has not been fulfilled successfully, try again later or the API doesn't support this feature",
				"parseError"            : "Errors Found - Check them out in errors.json",
				"profilingFailed"       : "The Profiling task failed for an unknown reason !\n",
			},
			"warning": {
				"invalidPortalURL" 		 : "We couldn't parse and identify this URL for some reason",
				"unsupportedPortal"    : "Sorry, but we don't support this kind of Portal at the moment",
				"noGroupsFound"				 : "There has been no groups identified in this portal\nTry the manual group search by ID\n",
				"invalidResourceName"  : "We couldn't find a resource with this name, please try again",
				"N/A"                  : "This Function is not implemented yet"
			},
			"prompt" : {
				"URLEntry"         : "Please enter the URL of the Data Portal: ",
				"actionSelection"  : "Please select one of the following actions",
				"reportSelection"  : "Please select which one of the following reports you like to generate",
				"groupNameEntry"   : "Please enter the Group name you wish to fetch details for (type 'exit' to return back to previous menu):",
				"datasetNameEntry" : "Please enter the dataset name you wish to fetch details for (type 'exit' to return back to previous menu):",
				"licenceVersion"   : "We have detected multiple license version information. Please select the correct one from below:",
				"saveProfiles"     : "Would you like to save automatically the generated reports and enhanced profiles ?",
				"saveQuality"      : "Would you like to save automatically the Quality reports ?",
				"cachedProfiles"   : "Would you like to overwrite cached profiles if found ?",
				"choiceList": [
				{ "value" : "profileDataset"        , "name" : "Profile a specific dataset"}                           ,
				{ "value" : "getAllDatasetsDetails" , "name" : "Fetch All the datasets in this portal"}                ,
				{ "value" : "getAllGroupsDetails"   , "name" : "Fetch All the datasets groups in this portal"}         ,
				{ "value" : "getGroupdetails"       , "name" : "Fetch the details of a specific group"}                ,
				{ "value" : "getDatasetDetails"     , "name" : "Fetch the details of a specific dataset"}              ,
				separator                           ,
				{ "value" : "portalReport"          , "name" : "Generate Data Portal level reports"}                   ,
				{ "value" : "groupReport"           , "name" : "Generate Group level reports"}                         ,
				separator                           ,
				{ "value" : "profileGroup"          , "name" : "Profile a specific Group"}                             ,
				{ "value" : "profileAllDatasets"    , "name" : "Profile All the datasets in this portal"}              ,
				separator                           ,
				{ "value" : "checkDatasetQuality"   , "name" : "Check the Quality of specific dataset"}              ,
				{ "value" : "checkGroupQuality"     , "name" : "Check the Quality of specific Group"}                ,
				{ "value" : "checkPortalQuality"    , "name" : "Check the Quality of All the datasets in this portal"} ,
				separator                           ,
				{ "value" : "addressEntry"          , "name" : "Return to Address Entry"}                              ,
				{ "value" : "exit"                  , "name" : "Exit"}											                           ,
				separator
				],
				"reportGenerationChoiceList" : [
				{ "value" : "valueAggregator"        , "name" : "Aggregate a meta-field values"}                ,
				{ "value" : "objectValueAggregator"  , "name" : "Aggregate a key:object meta-field values"}     ,
				{ "value" : "checkEmpty"             , "name" : "Check Empty field values"}                     ,
				{ "value" : "exit"                   , "name" : "<-- Go back to previous menu"}								  ,
				],
				"manualPortalURLEntry" : "Would you like to  manually enter the desired portal URL: "
			},
			"info" : {
				"welcomeMessage"       : "Welcome to the Data Portal Crawler\nThrough the process type exit anytime if you wish to quit\n\n",
				"menuReturn"           : "\n",
				"portalDataCheck"      : "Checking Data Portal for URL: ",
				"portalCheck"          : "Trying to automatically identify the type of this data portal",
				"getAllDatasetsDetails": "Getting all datasets details from this portal ...",
				"CKAN"                 : "Data portal identified as CKAN",
				"sokrata"              : "Data Portal identified as being hosted under: SOCRATA",
				"DKAN"                 : "Data Portal identified as being hosted under: DKAN",
				"datatank"             : "Data Portal identified as being hosted under: Datatank",
				"datasetsFetched"      : "The datasets list and their data files have been fetched successfully !!\nYou can access them in the cache folder\n",
				"datasetFetched"       : "This dataset information has been fetched successfully\n",
				"groupFetched"         : "This Group information has been fetched successfully\n",
				"groupsFetched"        : "The groups list have been fetched\nYou can access them in the cache folder\n",
				"profilingCompleted"   : "The Profiling task has been completed Successfully !\n",
				"reportGenerated"      : "The Report has been generated Successfully !\n"
			}
		}
	};

	module.exports = messages;