import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import CommandPalette from './CommandPalette'

var Mock = require('mockjs')

const generateData = (n, len) => {
    return [...new Array(len).keys()].map((d, idx) => {
        const word = Mock.Random.word(3, 5)
        return {
            id: word,
            title: `${n}. ${word} - ${idx}`,
            meta: Mock.Random.integer(10, 10000),
            desc: Mock.Random.sentence(10, 100)
        }
    })
}

let lib = {}
let steps = []

const getData = (obj, paths) => {
    let p = [...paths]
    let key = p.shift()
    if (key) {
        if (obj[key]) {
            return getData(obj[key], p)
        } else {
            return null
        }
    } else {
        return obj
    }
}
const injectData = (step, item, cb) => {
    console.log(step, item)

    if (item) steps.push(item.id)
    if (step === 0) {
        fetch('https://api.bootcdn.cn/libraries.min.json')
            .then(res => res.json())
            .then(items => {
                const data = items.map(([title, desc, meta]) => {
                    lib[title] = {}
                    return { id: title, title, desc, meta }
                })
                cb(data)
            })
    } else if (step === 1) {
        fetch(`https://api.bootcdn.cn/libraries/${item.id}.json`)
            .then(res => res.json())
            .then(d => {
                console.log('version', d)
                const data = d.assets.map(({version, files}) => {
                    lib[item.id][version] = files
                    return { id: version, title: version }
                })
                // lib[d.id] = d.assets
                cb(data)
            })
        // setTimeout(() => {
        //     cb(generateData(step, 1000))
        // }, Math.random() * 500)
    } else if (step === 2) {
        const items = getData(lib, steps).map(item => {
            return { id: item, title: item }
        })
        cb(items)
    }
}


ReactDOM.render(
<CommandPalette step={0} 
    async={injectData}
    data={[
        [],
        [],
        [],
        // generateData(0, 1000), 
        // generateData(1, 1000),
        // generateData(2, 1000)
    ]} 
/>, 
document.getElementById('root'))
