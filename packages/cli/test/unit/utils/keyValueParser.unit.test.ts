import {expect} from '@oclif/test'
import parseKeyValue from '../../../src/lib/utils/keyValueParser'

const exampleInput1 = 'Domain Name=ztestdomain7'
const exampleInput2 = 'exampleKey=value'
const exampleInput3 = 'example key=example value'

describe('keyValueParser', function () {
  it('parses and extracts key/value pairs', function () {
    const {key: exampleKey1, value: exampleValue1} = parseKeyValue(exampleInput1)
    const {key: exampleKey2, value: exampleValue2} = parseKeyValue(exampleInput2)
    const {key: exampleKey3, value: exampleValue3} = parseKeyValue(exampleInput3)

    expect(exampleKey1).to.equal('Domain Name')
    expect(exampleValue1).to.equal('ztestdomain7')
    expect(exampleKey2).to.equal('exampleKey')
    expect(exampleValue2).to.equal('value')
    expect(exampleKey3).to.equal('example key')
    expect(exampleValue3).to.equal('example value')
  })
})
