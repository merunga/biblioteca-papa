// node libs
var path = require('path');
var fs = require('fs');

// external libs
var cheerio = require('cheerio');
var lunr = require('lunr');
var _ = require('lodash');
var through2 = require('through2');
var fm = require('front-matter');

function LunrIndex(paths) {
  this._paths = paths;

  this._index = lunr(function () {
    this.ref('url');
    this.field('title', { boost: 10 });
    this.field('tags', { boost: 100 });
    this.field('body');
  });

  this._data = {};
}

LunrIndex.prototype.indexPage = function (page) {
  var $ = cheerio.load(page.body);
  var body = $('body').find("script,noscript,style").remove().end().text();

  var baseItem = {
    url: page.dest,
    title: page.attributes.title || page.attributes.titulo || page.attributes.nombre || page.dest,
    tags: (page.attributes.tags || []).join(' ')
  };
  this._data[page.dest] = baseItem;

  var item = _.extend({}, baseItem, {body: body});
  this._index.add(item);
};

LunrIndex.prototype.indexFile = function (file) {
  var dest = path.join('/', file.path);
  console.log(file.base, file.cwd, filePath)
  var pageHtml = file.contents.toString('utf8');

  fileName = path.basename(file.path);

  fs.readFile(filePath, 'utf8', function(err, data){
    if (err) throw err

    var page = fm(data)
    page.body = pageHtml;
    page.dest = dest;

    self.indexPage(page);
  });
};

LunrIndex.prototype.generateSearchIndex = function () {
  return JSON.stringify(this._index);
};

LunrIndex.prototype.generateSearchData = function () {
  return JSON.stringify(this._data);
};

LunrIndex.prototype.index = function(filePath) {
  var self = this;

  return through2.obj(function (file, enc, callback) {
    var dest = filePath
      .replace('/home/merunga/lasmaquinitas/hope/biblioteca-papa/contenido', '')
      .replace('.md', '.html').replace('.hbs', '.html');

    var pageHtml = file.contents.toString('utf8');

    fs.readFile(filePath, 'utf8', function(err, data){
      if (err) throw err

      var page = fm(data)
      if(!page.attributes.excludeFromSearch) {
        page.body = pageHtml;
        page.dest = dest;

        self.indexPage(page);        
      } else {
        console.log('Excluido de la busqueda', dest)
      }

      callback();
    })
  });
};

module.exports = LunrIndex;

// var opts = assemble.config;

// /**
//  * Lunr Search Middleware
//  * @param  {Object}   params
//  * @param  {Function} callback
//  */
// var middleware = function(params, callback) {

//   opts.lunr = opts.lunr || {
//     dataPath: path.join(process.cwd(), 'search_index.json')
//   };

//   // call before each page is rendered to get
//   // information from the context
//   var gatherSearchInformation = function () {
//     addCacheItem(params.page);
//     params.context.lunr = params.context.lunr || {};
//     params.context.lunr.dataPath = params.context.lunr.dataPath || 'search_index.json';
//   };

//   var indexPageContent = function () {
//     updateCacheItem(params.page, params.content);
//   };

//   var generateSearchDataFile = function () {
//     _.forOwn(cache, function(item, url) {
//       idx.add(item);
//     });

//     fs.writeFileSync(opts.lunr.dataPath, JSON.stringify(idx));
//   };

// };