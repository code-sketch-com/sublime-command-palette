import React, { Component } from 'react';

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

const copy = obj => JSON.parse(JSON.stringify(obj));

class ListView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeFrame: 0
    };
  }

  render() {
    const {
      pk,
      activeCls,
      current,
      className,
      alias
    } = this.props;

    const getActiveCls = ({
      id
    }) => id === current[pk] ? activeCls : '';

    const items = this.slice();
    return React.createElement("div", {
      className: className,
      ref: el => this.viewPort = el,
      onScroll: this.handleScroll.bind(this)
    }, React.createElement("ul", {
      ref: el => this.list = el
    }, React.createElement("li", {
      className: "alias"
    }, alias.map(item => React.createElement("div", {
      onClick: e => this.props.handleAliasClick(item, e),
      key: item.name
    }, item.name))), items.map((item, idx) => React.createElement("li", {
      key: `${item[pk]}-${idx}`,
      onClick: e => this.props.handleClick(item, e),
      className: getActiveCls(item)
    }, React.createElement("h5", null, React.createElement("span", {
      dangerouslySetInnerHTML: this.props.hlContent(item.title)
    }), item.meta ? React.createElement("em", null, "\u2605 ", item.meta) : ''), item.desc ? React.createElement("p", null, item.desc) : ''))));
  }

  slice() {
    const idx = (this.props.itemsPerPage || 50) * (this.state.activeFrame + 1);
    return this.props.items.slice(0, idx);
  }

  componentDidUpdate() {
    this.frames = Math.ceil(this.props.items.length / this.props.itemsPerPage);
    const {
      pk,
      current
    } = this.props;
    const items = this.slice();
    const len = items.length;
    const idx = items.findIndex(item => item[pk] === current[pk]);
    this.props.frameUpdate(items, len, idx);
  }

  handleScroll() {
    const fullHeight = this.list.clientHeight;
    const viewHeight = this.viewPort.clientHeight;
    const scrollTop = this.viewPort.scrollTop;

    if (viewHeight + scrollTop >= fullHeight) {
      this.loadNextFrame();
    }
  }

  loadNextFrame() {
    if (this.state.activeFrame < this.frames) {
      this.setState({
        activeFrame: this.state.activeFrame + 1
      });
    } else {
      this.setState({
        done: true
      });
      console.log('done');
    }
  }

}

class CommandPalette extends Component {
  constructor(props) {
    super(props);
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
    };
    this.loading = false;
    this.results = new Array(props.data.length).fill(null);
  }

  render() {
    const {
      current,
      keyword,
      active,
      items
    } = this.state;
    const {
      activeCls,
      placeholder,
      pk,
      alias
    } = this.props;
    const cmdStyle = {
      display: active ? 'block' : 'none'
    };
    return React.createElement("div", {
      className: "cmd-palette",
      onClick: e => e.stopPropagation(),
      style: cmdStyle
    }, React.createElement("div", {
      className: "cp-form"
    }, React.createElement("input", {
      type: "text",
      spellCheck: false,
      placeholder: placeholder,
      className: "cmd-palette-input",
      value: keyword,
      onChange: this.handleChange.bind(this),
      onKeyUp: this.handleTyping.bind(this),
      ref: el => this.input = el
    })), React.createElement(ListView, {
      alias: alias,
      className: "cp-result",
      pk: pk,
      activeCls: activeCls,
      frameUpdate: this.frameUpdate.bind(this),
      items: items,
      keyword: keyword,
      current: current,
      hlContent: this.hlContent.bind(this),
      handleClick: this.handleClick.bind(this),
      handleAliasClick: this.handleAliasClick.bind(this)
    }));
  } // current step full data copy


  get items() {
    return copy(this.data[this.state.step]);
  }

  get rLen() {
    return this.results.length;
  }

  get defaultSelected() {
    return this.props.defaultSelected;
  }

  handleChange(e) {
    this.setState({
      keyword: e.target.value
    });
    clearTimeout(this.timer);
    this.timer = setTimeout(this.filter.bind(this), this.props.delay);
  }

  handleTyping(e) {
    if (e.key === 'Enter') {
      this.handlePick();
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      this.navigate(e.key);
    }
  }

  handleClick(current) {
    this.setState({
      current
    }, () => {
      this.updateResults();
      this.handlePick();
    });
  }

  handleAliasClick(alias) {
    this.props.aliasClick(alias);
  }

  toggle() {
    this.setState({
      active: !this.state.active
    }, () => {
      if (this.state.active) {
        this.setState({
          current: { ...this.state.items[0]
          }
        });
        this.input.focus();
      }
    });
  }

  frameUpdate(items, len, idx) {
    this.vItems = items;
    this.vLen = len;
    this.vIdx = idx;
  }

  navigate(key) {
    const items = this.vItems;
    const len = this.vLen;
    const idx = this.vIdx;
    let current = {};

    if (key === 'ArrowUp') {
      if (idx <= 0) {
        current = { ...items[len - 1]
        };
      }

      if (idx > 0) {
        current = { ...items[idx - 1]
        };
      }
    }

    if (key === 'ArrowDown') {
      if (idx + 1 >= len) {
        current = { ...items[0]
        };
      }

      if (idx + 1 < len) {
        current = { ...items[idx + 1]
        };
      }
    }

    this.setState({
      current
    }, () => {
      this.updateResults();
      this.scrollToEl();
    });
  }

  updateResults() {
    this.results[this.state.step] = { ...this.state.current
    };
  }

  scrollToEl() {
    let el = document.querySelector('.cmd-palette .cp-result .active');

    if (el) {
      el.scrollIntoView({
        alignToTop: false,
        behavior: "smooth"
      });
    }
  }

  handlePick() {
    if (!this.loading) {
      this.loading = true;
      this.pickStep(this.state.step + 1);
    }
  }

  pickStep(step, cb) {
    if (step === this.rLen && this.state.current.id) return this.done();
    if (step > this.rLen) return this.reset();

    if (this.props.async) {
      this.pickAsync(step, cb);
    } else {
      this.pick(step, cb);
    }
  }

  pickAsync(step, cb) {
    const {
      async
    } = this.props;
    if (typeof async !== 'function') throw new Error('async type must pass a hook props [async]');

    if (!this.state.current.id && step > 0) {
      this.loading = false;
    } else {
      async(step, this.state.current, this.results, data => {
        this.data[step] = data;
        this.pick(step, cb);
      }, err => {
        console.error(err);
        this.loading = false;
      });
    }
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
        this.onSelect();
        this.scrollToEl();
        if (cb) cb();
      });
    });
  }

  done() {
    this.props.done(copy(this.results));
    this.reset();
  }

  reset() {
    this.loading = false; // console.log('done', this.results.map(d => d[this.props.pk]))

    this.setState({
      keyword: '',
      active: false,
      items: this.data[this.props.step],
      current: this.items[this.defaultSelected],
      step: this.props.step
    });
  }

  onSelect() {
    const {
      step,
      current
    } = this.state;
    this.results[step] = { ...current
    };
    this.loading = false; // console.log('selected', this.items[this.defaultSelected])
  }

  hlHTML(content) {
    const keyword = this.state.keyword;
    return keyword === '' ? content : content.replace(new RegExp(keyword, 'g'), `<strong>${keyword}</strong>`);
  }

  hlContent(str) {
    return {
      __html: this.hlHTML(str)
    };
  }

  filter() {
    const items = this.items.filter(item => item.title.includes(this.state.keyword));
    this.setState({
      items,
      current: { ...items[0]
      }
    }, this.updateResults.bind(this));
  }

  stopPrevent(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  handleDocClick(e) {
    const parentIsCP = node => {
      if (node.classList && node.classList.contains('cmd-palette')) {
        return true;
      } else {
        while (node.parentNode) {
          return parentIsCP(node.parentNode);
        }

        return false;
      }
    };

    if (!parentIsCP(e.target)) {
      this.setState({
        active: false
      });
    }
  }

  handleDocKeyDown(e) {
    if (e.metaKey) {
      if (e.key === 'p') {
        this.stopPrevent(e);
        this.toggle();
      }
    }

    if (e.key === 'Escape') {
      this.reset();
    }
  }

  bindKeyMap() {
    document.addEventListener('keydown', this.handleDocKeyDown.bind(this));
    document.addEventListener('click', this.handleDocClick.bind(this), true);
  }

  unbindKeyMap() {
    document.removeEventListener('keydown', this.handleDocKeyDown.bind(this));
    document.removeEventListener('click', this.handleDocClick.bind(this));
  }

  componentWillUnmount() {
    this.unbindKeyMap();
  }

  componentDidMount() {
    const props = this.props; // if (props.active) {

    this.pickStep(0, () => {
      if (props.autoFocus) {
        this.input.focus();
      }
    }); // }

    this.bindKeyMap(); // cache initial data

    this.data = copy(props.data);
    this.setState({
      alias: props.alias,
      step: props.step,
      items: this.data[props.step],
      active: props.active,
      current: this.data[props.step][props.defaultSelected]
    });
  }

}

_defineProperty(CommandPalette, "defaultProps", {
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
  alias: [{
    name: 'React',
    result: '<script src="https://cdn.bootcss.com/react/16.4.0/umd/react.production.min.js"></script>\n<script src="https://cdn.bootcss.com/react-dom/16.4.0/umd/react-dom.production.min.js"></script>'
  }, {
    name: 'Vue',
    result: '<script src="https://cdn.bootcss.com/vue/2.5.16/vue.js"></script>'
  }, {
    name: 'jQuery',
    result: '<script src="https://cdn.bootcss.com/jquery/3.3.1/jquery.js"></script>'
  }, {
    name: 'Bootstrap',
    result: '<link rel="stylesheet" href="https://cdn.bootcss.com/twitter-bootstrap/4.1.1/css/bootstrap.css">\n<script src="https://cdn.bootcss.com/twitter-bootstrap/4.1.1/js/bootstrap.js"></script>'
  }, {
    name: 'Semantic-ui',
    result: '<link rel="stylesheet" href="https://cdn.bootcss.com/semantic-ui/2.3.1/semantic.css">\n<script src="https://cdn.bootcss.com/semantic-ui/2.3.1/semantic.js"></script>'
  }],
  done: () => {}
});

export default CommandPalette;
