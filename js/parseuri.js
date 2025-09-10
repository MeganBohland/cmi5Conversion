/**
 * parseUri 1.2.2
 * (c) Steven Levithan <stevenlevithan.com>
 * MIT License
 *
 * Function that parses a URL to return various pieces.
 * Test Page: http://stevenlevithan.com/demo/parseuri/js/
 *
 * Returns:
 *  An object with the following properties based on this example URL:
 *  http://usr:pwd@www.test.com:81/dir/dir.2/index.htm?q1=0&&test1&test2=value#top
 *  protocol  - Ex: 'http'
 *  authority - Ex: 'usr:pwd@www.test.com'
 *  userInfo  - Ex: 'usr:pwd'
 *  user      - Ex: 'usr'
 *  password  - Ex: 'pwd'
 *  host      - Ex: 'www.test.com'
 *  port      - Ex: '81'
 *  relative  - Ex: '/dir/dir.2/index.htm?q1=0&&test1&test2=value#top'
 *  path      - Ex: '/dir/dir.2/index.htm'
 *  directory - Ex: '/dir/dir.2/'
 *  file      - Ex: 'index.htm'
 *  query     - Ex: 'q1=0&&test1&test2=value'
 *  anchor    - Ex: 'top'
 *  queryKey  - Ex: Object with three key/value pairs: queryKey.q1='0', queryKey.test1=[empty string], queryKey.test2='value'
 *
 */
function parseUri(str) {
    var o = parseUri.options,
    m = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
    uri = {},
    i = 14;

    while (i--){
        uri[o.key[i]] = m[i] || "";
    }
    uri[o.q.name] = {};
    uri[o.key[12]].replace(o.q.parser, function($0, $1, $2) {
        if ($1){
            uri[o.q.name][$1] = $2;
        }
    });

    return uri;
}
parseUri.options = {
    strictMode: false,
    key: ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"],
    q: {
        name: "queryKey",
        parser: /(?:^|&)([^&=]*)=?([^&]*)/g
    },
    parser: {
        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
    }
};