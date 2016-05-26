import React from 'react'
import ReactDOM from 'react-dom'
import $ from 'jquery';
import jQuery from 'jquery'
// import 'semantic-ui-checkbox/checkbox.js';

$.fn.checkbox = require('semantic-ui-checkbox')

const SIC_DICT = {
    "7": { "color": ["#db2828", "red"], "name": "agriculture, forestry, fishing" },
    "10": { "color": ["#f2711c", "orange"], "name": "mining" },
    "15": { "color": ["#fbbd08", "yellow"], "name": "construction" },
    "20": { "color": ["#b5cc18", "olive"], "name": "manufacturing" },
    "40": { "color": ["#21ba45", "green"], "name": "transportation & public utilities" },
    "50": { "color": ["#00b5ad", "teal"], "name": "wholesale trade" },
    "52": { "color": ["#2185d0", "blue"], "name": "retail trade" },
    "60": { "color": ["#a333c8", "purple"], "name": "finance, insurance, real estate" },
    "70": { "color": ["#e03997", "pink"], "name": "services" }
}

export default class Menu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectAll: false,
            selected: new Set(),
        }
        this.handleHighlightClick = this.handleHighlightClick.bind(this);
        this.toggleSelected = this.toggleSelected.bind(this);
    };

    handleHighlightClick() {
        console.log("hi")
        this.setState({ selectAll: !this.state.selectAll })
            // if (this.state.selectAll) {
            //     $(".ui.checkbox.sic").checkbox("check");
            // } else {
            //     $(".ui.checkbox.sic").checkbox("uncheck");
            // }
    }

    toggleSelected(entry) {
        var newState;
        if (this.state.selected.has(entry) || this.state.selectAll) {
            this.state.selected.delete(entry);
            this.setState({ selectAll: false });
            $(".checkbox.sic").checkbox("uncheck");

        } else {
            this.state.selected.add(entry);
        }
        this.setState({ selected: this.state.selected });

    }

    render() {
        return (
            <Toggles handleHighlightClick={this.handleHighlightClick} toggleSelected={this.toggleSelected} data={this.state}/>
        );
    }
}

class Toggles extends React.Component {
    constructor(props) {
        super(props);
    }

    isChecked() {
        return (this.props.data.selectAll) ? "highlightAll" : ""
    }

    componentDidMount() {
        let handleHighlightClick = this.props.handleHighlightClick;
        $(".checkbox.sic").checkbox({
            onChecked: function() {
                return handleHighlightClick()
            },
            onUnchecked: function() {
                return handleHighlightClick()
            }
        });
    }

    render() {
        return (
            <div className="ui grid right">
                <div className="row">
                    <div className="right floated column">
                        <div className="ui toggle checkbox axis">
                            <label>Use shared y-axis</label>
                            <input type="checkbox" name="public" />
                        </div>
                        <div className="ui hidden divider"></div>
                        <div  className={"ui toggle checkbox sic " + this.isChecked()}>
                            <label>Highlight all</label>
                            <input type="checkbox" name="public" />
                        </div>

                        <div className="ui hidden divider"></div>
                        <div className="controls container">
                            <div className="buttoncontainer ui segment">
                                <h4 className="ui header">Hover to highlight</h4>
                                <LabelControls data={this.props.data} toggleSelected={this.props.toggleSelected} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

class LabelControls extends React.Component {
    constructor(props) {
        super(props);
        this.makeToolTip = this.makeToolTip.bind(this);
    }
    makeToolTip(key) {
        const HTML = key + ': ' + SIC_DICT[key].name
        return HTML;
    }

    render() {
        const keys = Object.keys(SIC_DICT);
        let makeToolTip = this.makeToolTip;
        const labels = keys.map((key, i) => <ButtonLabel toggleSelected={this.props.toggleSelected} data={this.props.data} sic={key} key={key}/>)
        return (
            <div>
                {labels}
            </div>
        )
    }
}

class ButtonLabel extends React.Component {
    constructor(props) {
        super(props);
    }
    makeToolTip(key) {
        const HTML = key + ': ' + SIC_DICT[key].name
        return HTML;
    }

    isSelected() {
        return this.props.data.selected.has(this.props.sic)
    }

    getStyle() {
        if (this.isSelected() || this.props.data.selectAll) {
            return ""
        } else {
            return " basic "
        }
    }

    handleClick() {
        this.props.toggleSelected(this.props.sic);
    }

    render() {
        const key = this.props.sic;
        const color = SIC_DICT[key].color[1];
        return (
            <div key={key} className="item">
                <button className={"ui horizontal small circular "+ this.getStyle() + color + " label"} data-key={key} onClick={() => this.handleClick()}></button> {this.makeToolTip(key)}
            </div>
        )

    }
}

ReactDOM.render(<Menu />, document.getElementById('page'))
