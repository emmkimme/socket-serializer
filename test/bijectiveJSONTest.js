const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const ssbModule = require('../lib/socket-serializer');

const bigData = require('./bigdata.json');

function ObjectEqual(a1, a2) {
  return JSON.stringify(a1) === JSON.stringify(a2);
}

describe('BijectiveJSON', () => {

  describe('big json', () => {
    it('JSON.stringify', () => {
      console.time('JSON.stringify - big json');
      let result = JSON.stringify(bigData);
      console.timeEnd('JSON.stringify - big json');

      console.time('JSON.parse - big json');
      let newbigdata = JSON.parse(result);
      console.timeEnd('JSON.parse - big json');
      assert(ObjectEqual(bigData, newbigdata));
    });

    it('BijectiveJSON.stringify', () => {
      console.time('BijectiveJSON.stringify - big json');
      let result = ssbModule.BijectiveJSON.stringify(bigData);
      console.timeEnd('BijectiveJSON.stringify - big json');

      console.time('BijectiveJSON.parse - big json');
      let newbigdata = ssbModule.BijectiveJSON.parse(result);
      console.timeEnd('BijectiveJSON.parse - big json');
      assert(ObjectEqual(bigData, newbigdata));
    });

    it('InlineBijectiveJSON.stringify', () => {
      console.time('InlineBijectiveJSON.stringify - big json');
      let result = JSON.stringify(bigData, (k, v) => {
        if (typeof v === 'undefined') {
          return ssbModule.JSON_TOKEN_UNDEFINED;
        }
        return v;
      });
      console.timeEnd('InlineBijectiveJSON.stringify - big json');

      console.time('InlineBijectiveJSON.parse - big json');
      let newbigdata = JSON.parse(result, (k, v) => {
        // if (v) {
        if (v === ssbModule.JSON_TOKEN_UNDEFINED) {
          return undefined;
        }
        if (v && v.data && (v.type === 'Buffer')) {
          return Buffer.from(v.data);
        }
        // if ((v.type === 'Date') && v.data) {
        //     return new Date(v.data);
        // }
        // }
        return v;
      });
      console.timeEnd('InlineBijectiveJSON.parse - big json');
      assert(ObjectEqual(bigData, newbigdata));
    });
  });

  describe('small json', () => {
    let busEvent = {
      channel: '/electron-common-ipc/myChannel/myRequest',
      sender: {
        id: 'MyPeer_1234567890',
        name: 'MyPeer_customName',
        process: {
          type: 'renderer',
          pid: 2000,
          rid: 2,
          wcid: 10,
          testUndefined: undefined
        },
        testArrayUndefined: [12, "str", undefined, 3, null, "end"]
      },
      request: {
        replyChannel: '/electron-common-ipc/myChannel/myRequest/replyChannel',
      }
    };

    it('JSON.stringify - small json', () => {
      let result;
      console.time('JSON.stringify - small json');
      for (i = 0; i < 10000; ++i) {
        result = JSON.stringify(busEvent);
      }
      console.timeEnd('JSON.stringify - small json');

      let resultParse;
      console.time('JSON.parse - small json');
      for (i = 0; i < 10000; ++i) {
        resultParse = JSON.parse(result);
      }
      console.timeEnd('JSON.parse - small json');
    });

    it('BijectiveJSON.stringify - small json', () => {
      let result;
      console.time('BijectiveJSON.stringify - small json');
      for (i = 0; i < 10000; ++i) {
        result = ssbModule.BijectiveJSON.stringify(busEvent);
      }
      console.timeEnd('BijectiveJSON.stringify - small json');

      let resultParse;
      console.time('BijectiveJSON.parse - small json');
      for (i = 0; i < 10000; ++i) {
        resultParse = ssbModule.BijectiveJSON.parse(result);
      }
      console.timeEnd('BijectiveJSON.parse - small json');
    });

    it('InlineBijectiveJSON.stringify - small json', () => {
      let result;
      console.time('InlineBijectiveJSON.stringify - small json');
      for (i = 0; i < 10000; ++i) {
        result = JSON.stringify(busEvent, (k, v) => {
          if (typeof v === 'undefined') {
            return ssbModule.JSON_TOKEN_UNDEFINED;
          }
          return v;
        });
      }
      console.timeEnd('InlineBijectiveJSON.stringify - small json');

      let resultParse;
      console.time('InlineBijectiveJSON.parse - small json');
      for (i = 0; i < 10000; ++i) {
        resultParse = JSON.parse(result, (k, v) => {
          // if (v) {
          if (v === ssbModule.JSON_TOKEN_UNDEFINED) {
            return undefined;
          }
          if (v && v.data && (v.type === 'Buffer')) {
            return Buffer.from(v.data);
          }
          // if ((v.type === 'Date') && v.data) {
          //     return new Date(v.data);
          // }
          // }
          return v;
        });
      }
      console.timeEnd('InlineBijectiveJSON.parse - small json');
    });
  });

  describe('complex json', () => {
    let busEvent = {
      channel: '/electron-common-ipc/myChannel/myRequest',
      sender: {
        id: 'MyPeer_1234567890',
        name: 'MyPeer_customName',
        process: {
          type: 'renderer',
          pid: 2000,
          rid: 2,
          wcid: 10,
          testUndefined: undefined
        },
        testArrayUndefined: [12, "str", undefined, 3, null, "end"],
        testBuffer: Buffer.from('ceci est un test')
      },
      request: {
        replyChannel: '/electron-common-ipc/myChannel/myRequest/replyChannel',
        testDate: new Date()
      }
    };

    it('BijectiveJSON.stringify - complex json', () => {
      let result;
      console.time('BijectiveJSON.stringify - complex json');
      for (i = 0; i < 10000; ++i) {
        result = ssbModule.BijectiveJSON.stringify(busEvent);
      }
      console.timeEnd('BijectiveJSON.stringify - complex json');

      let resultParse;
      console.time('BijectiveJSON.parse - complex json');
      for (i = 0; i < 10000; ++i) {
        resultParse = ssbModule.BijectiveJSON.parse(result);
      }
      console.timeEnd('BijectiveJSON.parse - complex json');
    });
  });


  describe('buffer json', () => {
    let busEvent = Buffer.from('ceci est un test');

    it('BijectiveJSON.stringify - buffer json', () => {
      let result;
      console.time('BijectiveJSON.stringify - buffer json');
      for (i = 0; i < 10000; ++i) {
        result = ssbModule.BijectiveJSON.stringify(busEvent);
      }
      console.timeEnd('BijectiveJSON.stringify - buffer json');

      let resultParse;
      console.time('BijectiveJSON.parse - buffer json');
      for (i = 0; i < 10000; ++i) {
        resultParse = ssbModule.BijectiveJSON.parse(result);
      }
      console.timeEnd('BijectiveJSON.parse - buffer json');
    });
  });

  // describe('date json', () => {
  //   let busEvent = new Date();

  //   it('BijectiveJSON.stringify - date json', () => {
  //     let result;
  //     console.time('BijectiveJSON.stringify - date json');
  //     for (i = 0; i < 10000; ++i) {
  //       result = ssbModule.BijectiveJSON.stringify(busEvent);
  //     }
  //     console.timeEnd('BijectiveJSON.stringify - date json');

  //     let resultParse;
  //     console.time('BijectiveJSON.parse - date json');
  //     for (i = 0; i < 10000; ++i) {
  //       resultParse = ssbModule.BijectiveJSON.parse(result);
  //     }
  //     console.timeEnd('BijectiveJSON.parse - date json');
  //   });
  // });

});