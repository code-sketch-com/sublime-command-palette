const React = require('react')
const ReactDOM = require('react-dom')

import CommandPalette from './CommandPalette'

import './CommandPalette.scss'

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

const fetchData = url => {
    const cacheData = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data))
        return data
    }
    if (localStorage.getItem(url)) {
        return Promise.resolve(JSON.parse(localStorage.getItem(url)))
    } else {
        return fetch(url)
            .then(res => res.json())
            .then(data => cacheData(url, data))
            .catch(err => {
                Promise.reject(err)
            })
    }
}
const processLibraryData = items => {
    return items.map(([title, desc, meta]) => {
        return { id: title, title, desc, meta }
    })
}
const processLibraryItemData = d => {
    return d.assets.map(({ version, files }) => {
        return { id: version, title: version }
    })
}
const injectData = (step, item, results, cb, error) => {
    const API = 'https://api.bootcdn.cn/libraries'

    if (step === 0) {
        fetchData(`${API}.min.json`)
            .then(processLibraryData)
            .then(cb)
            .catch(error)
    } else if (step === 1) {
        if (!item.id) return error('none matched.')
        fetchData(`${API}/${item.id}.json`)
            .then(processLibraryItemData)
            .then(cb)
            .catch(error)
    } else if (step === 2) {
        const paths = results.filter(d => d !== null).map(d => d.id)
        const lib = JSON.parse(localStorage.getItem(`${API}/${paths[0]}.json`))

        if (!paths[1]) return error('none matched.')

        const items = lib.assets
            .find(({ version }) => version === paths[1])
            .files.map(file => {
                return { id: file, title: file }
            })
        cb(items)
    }
}
const done = res => {
    const [name, version, file] = res.map(r => r.id)
    const url = `https://cdn.bootcss.com/${name}/${version}/${file}`
    console.log([name, version, file])
    console.log(url)
}
const aliasClick = (item) => {
    console.log(item.result)
}

ReactDOM.render(
    <CommandPalette
        step={0}
        async={injectData}
        done={done}
        aliasClick={aliasClick}
        data={[
            [],
            [],
            []
            // generateData(0, 1000),
            // generateData(1, 1000),
            // generateData(2, 1000)
        ]}
    />,
    document.getElementById('root')
)
