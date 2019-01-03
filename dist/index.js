import React, { Component } from 'react'

const copy = (obj) => JSON.parse(JSON.stringify(obj))

class ListView extends Component {
    static defaultProps = {
        itemsPerPage: 10
    }
    constructor(props) {
        super(props)

        this.state = {
            activeFrame: 0
        }
    }
    render() {
        const { pk, activeCls, current, itemsPerPage, className, items } = this.props
        const activeFrame = this.state.activeFrame
        const getActiveCls = ({id}) => id === current[pk] ? activeCls : ''
        const destIdx = itemsPerPage * (activeFrame + 1)

        return (
            <div className={className} 
                ref={el => this.viewPort = el}
                onScroll={this.handleScroll.bind(this)}>
                <ul ref={el => this.list = el}>
                    {items.slice(0, destIdx).map((item, idx) => 
                        <li key={`${item[pk]}-${idx}`} 
                            onClick={() => this.props.handleClick(item)} 
                            className={getActiveCls(item)}>
                            <h5>
                                <span dangerouslySetInnerHTML={this.props.hlContent(item.title)}></span>
                                {item.meta ? <em>★ {item.meta}</em> : ''}
                            </h5>
                            {item.desc ? <p>{item.desc}</p> : ''}
                        </li>
                    )}
                </ul>
            </div>
        )
    }
    componentDidUpdate() {
        this.frames = Math.ceil(this.props.items.length / this.props.itemsPerPage)
    }
    handleScroll() {
        const fullHeight = this.list.clientHeight
        const viewHeight = this.viewPort.clientHeight
        const scrollTop = this.viewPort.scrollTop
        
        if (viewHeight + scrollTop >= fullHeight) {
            this.loadNextFrame()
        }
    }
    loadNextFrame() {
        if (this.state.activeFrame < this.frames) {
            this.setState({
                activeFrame: this.state.activeFrame + 1
            })
        } else {
            this.setState({
                done: true
            })
            console.log('done')
        }
    }
}

class CommandPalette extends Component {
    static defaultProps = {
        step: 0,
        active: true,
        data: [[]],
        // primaryKey
        pk: 'id',

        autoFocus: true,
        activeCls: 'active',
        delay: 300,
        defaultSelected: 0,
        placeholder: '',
        async: false,
        done: () => {}
    }
    constructor(props) {
        super(props)

        this.state = {
            // 当前第N步选择
            step: 0,
            // 当前步骤数据
            items: [],
            // 是否显示
            active: false,
            // 当前选中项
            current: {},
            // 过滤关键字
            keyword: ''
        }

        this.loading = false
        this.results = new Array(props.data.length).fill(null)
    }
    render() {
        const { current, keyword, active, items } = this.state
        const { activeCls, placeholder, pk } = this.props

        const cmdStyle = { display: active ? 'block' : 'none' }

        return (
            <div className="cmd-palette" style={cmdStyle}>
                <div className="cp-form">
                    <input type="text" spellCheck={false}
                        placeholder={placeholder}
                        className="cmd-palette-input"
                        value={keyword}
                        onChange={this.handleChange.bind(this)}
                        onKeyUp={this.handleTyping.bind(this)} ref={el => this.input = el} />
                </div>
                <ListView className="cp-result" pk={pk} activeCls={activeCls}
                    items={items} keyword={keyword} current={current}
                    hlContent={this.hlContent.bind(this)}
                    handleClick={this.handleClick.bind(this)} />
            </div>
        )
    }
    // current step full data copy
    get items() {
        return copy(this.data[this.state.step])
    }
    get rLen() {
        return this.results.length
    }
    get defaultSelected() {
        return this.props.defaultSelected
    }

    handleChange(e) {
        this.setState({ keyword: e.target.value })
        clearTimeout(this.timer)
        this.timer = setTimeout(this.filter.bind(this), this.props.delay)
    }
    handleTyping(e) {
        if (e.key === 'Enter') {
            this.handlePick()
        }

        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            this.navigate(e.key)
        }
    }
    handleClick(current) {
        this.setState({ current }, () => this.handlePick())
    }

    toggle() {
        this.setState({ active: !this.state.active }, () => {
            if (this.state.active) {
                this.input.focus()
            }
        })
    }
    navigate(key) {
        const { items, current, pk } = this.state
        const len = items.length
        const dest = items.findIndex(item => item[pk] === current[pk])
        let curr = { ...current }

        if (key === 'ArrowUp') {
            if (dest <= 0) {
                curr = { ...items[len - 1] }
            }
            if (dest > 0) {
                curr = { ...items[dest - 1] }
            }
        }
        if (key === 'ArrowDown') {
            if (dest + 1 >= len) {
                curr = { ...items[0] }
            }
            if (dest + 1 < len) {
                curr = { ...items[dest + 1] }
            }
        }
        
        this.setState({ current: curr }, () => {
            this.results[this.state.step] = { ...this.state.current }
            this.scrollToEl()
        })
    }
    scrollToEl() {
        let el = document.querySelector('.cmd-palette .cp-result .active')
        if (el) {
            el.scrollIntoView({ alignToTop: false, behavior: "smooth" })
        } 
    }
    handlePick() {
        if (!this.loading) {
            this.loading = true
            this.pickStep(this.state.step + 1)
        }
    }
    pickStep(step, cb) {
        if (step === this.rLen) return this.done()
        if (step >= this.rLen) return

        if (this.props.async) {
            this.pickAsync(step, cb)
        } else {
            this.pick(step, cb)
        }
    }
    pickAsync(step, cb) {
        const { async } = this.props
        if (typeof async !== 'function') 
            throw new Error('async type must pass a hook props [async]')

        async(step, this.state.current, this.results, data => {
            this.data[step] = data
            this.pick(step, cb)
        })
    }
    pick(step, cb) {
        this.setState({
            keyword: '',
            step: step
        }, () => {
            this.setState({
                items: this.items,
                current: this.items[this.defaultSelected]
            }, () => {
                this.onSelect()
                this.scrollToEl()
                if (cb) cb()
            })
        })
    }

    done() {
        // console.log('done', this.results.map(d => d[this.props.pk]))
        this.setState({
            keyword: '',
            active: false,
            step: this.props.step
        })
        this.props.done(copy(this.results))
    }
    onSelect() {
        const { step, current } = this.state
        this.results[step] = { ...current }

        this.loading = false
        // console.log('selected', this.items[this.defaultSelected])
    }

    hlHTML(content) {
        const keyword = this.state.keyword
        return keyword === ''
            ? content
            : content.replace(new RegExp(keyword, 'g'), `<strong>${keyword}</strong>`)
    }
    hlContent(str) {
        return {
            __html: this.hlHTML(str)
        }
    }
    filter() {
        const items = this.items.filter(item => item.title.includes(this.state.keyword))
        this.setState({ items, current: { ...items[0] } })
    }

    stopPrevent(e) {
        e.stopPropagation()
        e.preventDefault()
    }
    handleDocClick(e) {
        const parentIsMe = (node) => {
            if (node.classList && node.classList.contains('cmd-palette')) {
                return true
            } else {
                while(node.parentNode) {
                    return parentIsMe(node.parentNode)
                }
            }
        }

        if (!parentIsMe(e.target)) {
            this.setState({ active: false })
        }
    }
    handleDocKeyDown(e) {
        if (e.metaKey) {
            if (e.key === 'p') {
                this.stopPrevent(e)
                this.toggle()
            }
        }
    }
    bindKeyMap() {
        document.addEventListener('keydown', this.handleDocKeyDown.bind(this))
        document.addEventListener('click', this.handleDocClick.bind(this))
    }
    unbindKeyMap() {
        document.removeEventListener('keydown', this.handleDocKeyDown.bind(this))
        document.removeEventListener('click', this.handleDocClick.bind(this))
    }
    componentWillUnmount() {
        this.unbindKeyMap()
    }
    componentDidMount() {
        const props = this.props

        if (props.active) {
            this.pickStep(0, () => {
                if (props.autoFocus) {
                    this.input.focus()
                }
            })
        }

        this.bindKeyMap()

        // cache initial data
        this.data = copy(props.data)

        this.setState({
            step: props.step,
            items: this.data[props.step],
            active: props.active,
            current: this.data[props.step][props.defaultSelected]
        })
    }
}

export default CommandPalette
