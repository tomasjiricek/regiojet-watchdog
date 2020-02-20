import React, { Component } from 'react';

const COMBINATION_SUBMIT_TIMEOUT = 1000;

export default class KnockCodeGrid extends Component {
    constructor(props) {
        super(props);
        this.combination = [];
        this.size = props.size;
        this.combinationSubmitTimer = null;
    }

    componentDidUpdate(prevProps) {
        if (this.props.size !== prevProps.size) {
            this.combination = [];
            this.removeSubmitTimer();
        }
    }

    handleBoxClicked = (boxId) => {
        if (this.combinationSubmitTimer) {
            this.removeSubmitTimer();
        }
        this.combination.push(boxId);
        this.combinationSubmitTimer = setTimeout(this.submitCombination, COMBINATION_SUBMIT_TIMEOUT);
    }

    submitCombination = () => {
        this.props.onSubmit(this.props.size, this.combination);
        this.combination = [];
        this.removeSubmitTimer();
    }

    removeSubmitTimer() {
        clearTimeout(this.combinationSubmitTimer);
        this.combinationSubmitTimer = null;
    }
    
    render() {
        return this.renderGrid();
    }

    renderGrid() {
        const { size } = this.props;
        const rows = [];
        const percentageSize = (100 / size) + '%';
        const colStyle = { 
            width: percentageSize,
            height: percentageSize,
            border: `1px solid #666`,
            borderCollapse: 'collapse',
        };

        for (let i = 0; i < size; i++) {
            const cols = [];
            const offset = i * size;
            for (let j = offset; j < offset + size; j++) {
                cols.push(<td key={j} style={colStyle} onClick={this.handleBoxClicked.bind(this, j)}></td>);
            }

            rows.push(<tr key={i}>{cols}</tr>);
        }

        return (
            <table className="knock-code-grid">
                <tbody>{rows}</tbody>
            </table>
        );
    }
}
