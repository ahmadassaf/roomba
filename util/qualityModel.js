function qualityModel() {
   return {
   "completeness": {
      "QI.1": {
         "description": "Existence of supporting structured metadata",
         "weight": 1,
         "score": 1
      },
      "QI.2": {
         "description": "Supports multiple serializations",
         "weight": 1,
         "score": 1
      },
      "QI.3": {
         "description": "Has different data access points",
         "weight": 1,
         "score": 1
      },
      "QI.4": {
         "description": "Uses datasets description vocabularies",
         "weight": 1,
         "score": 1
      },
      "QI.5": {
         "description": "Existence of descriptions about its size",
         "weight": 1,
         "score": 1
      },
      "QI.6": {
         "description": "Existence of descriptions about its structure (MIME Type, Format)",
         "weight": 1,
         "score": 1
      },
      "QI.7": {
         "description": "Existence of descriptions about its organization and categorization",
         "weight": 1,
         "score": 1
      },
      "QI.9": {
         "description": "Existence of dereferencable links for the dataset and its resources",
         "weight": 1,
         "score": 1
      }
   },
   "availability": {
      "QI.18": {
         "description": "Existence of an RDF dump that can be downloaded by users",
         "weight": 1,
         "score": 1
      },
      "QI.19": {
         "description": "Existence of queryable endpoints that respond to direct queries",
         "weight": 1,
         "score": 1
      },
       "QI.20": {
         "description": "Existence of valid dereferencable URLs (respond to HTTP request)",
         "weight": 1,
         "score": 1
      }
   },
   "licensing": {
      "QI.21": {
         "description": "Existence of human and machine readable license information",
         "weight": 1,
         "score": 1
      },
      "QI.22": {
         "description": "Existence of dereferencable links to the full license information",
         "weight": 1,
         "score": 1
      }
   },
   "freshness": {
      "QI.24": {
         "description": "Existence of timestamps that can keep track of its modifications",
         "weight": 1,
         "score": 1
      }
   },
   "correctness": {
      "QI.25": {
         "description": "Includes the correct MIME type for the content",
         "weight": 1,
         "score": 1
      },
      "QI.26": {
         "description": "Includes the correct size for the content",
         "weight": 1,
         "score": 1
      },
      "QI.28": {
         "description": "Absence of Syntactic errors on the links level",
         "weight": 1,
         "score": 1
      }
   },
   "comprehensibility": {
      "QI.37": {
         "description": "Existence of at least one exemplary RDF file",
         "weight": 1,
         "score": 1
      },
      "QI.39": {
         "description": "Existence of general information (title, URL, description) for the dataset",
         "weight": 1,
         "score": 1
      },
      "QI.40": {
         "description": "Existence of mailing list, message board or point of contact",
         "weight": 1,
         "score": 1
      }
   },
   "provenance": {
      "QI.44": {
         "description": "Existence of metadata that describes its authoritative information",
         "weight": 1,
         "score": 1
      },
      "QI.46": {
         "description": "Usage of versioning",
         "weight": 1,
         "score": 1
      }
   },
   "security": {
      "QI.43": {
         "description": "Uses login credentials to restrict access",
         "weight": 1,
         "score": 1
      },
      "QI.44": {
         "description": "Uses SSL or SSH to provide access to the dataset",
         "weight": 1,
         "score": 1
      }
   }
}
}

module.exports = qualityModel;