import React, { Component } from 'react';

const PATTERN_SUBMIT_TIMEOUT = 1500;

export default class KnockCodeGrid extends Component {
    constructor(props) {
        super(props);
        this.pattern = [];
        this.size = props.size;
        this.patternSubmitTimer = null;
    }

    componentDidUpdate(prevProps) {
        if (this.props.size !== prevProps.size) {
            this.pattern = [];
            this.removeSubmitTimer();
        }
    }

    handleGridBlockClicked = (blockId, event) => {
        event.preventDefault();

        if (this.patternSubmitTimer) {
            this.removeSubmitTimer();
        }

        this.pattern.push(blockId);
        this.patternSubmitTimer = setTimeout(this.submitPattern, PATTERN_SUBMIT_TIMEOUT);
    }

    submitPattern = () => {
        this.props.onSubmit(this.props.size, this.pattern);
        this.pattern = [];
        this.removeSubmitTimer();
    }

    removeSubmitTimer() {
        clearTimeout(this.patternSubmitTimer);
        this.patternSubmitTimer = null;
    }

    render() {
        return (
            <table className="knock-code-grid">
                <tbody>{this.renderGridRows()}</tbody>
            </table>
        );
    }

    renderGridRows() {
        const { size } = this.props;
        const rows = [];
        const percentageSize = (100 / size) + '%';
        const colStyle = { width: percentageSize, height: percentageSize};

        for (let i = 0; i < size; i++) {
            const cols = [];
            const offset = i * size;
            for (let j = offset; j < offset + size; j++) {
                cols.push(
                    <td
                        key={j}
                        style={colStyle}
                        onMouseDown={this.handleGridBlockClicked.bind(this, j)}
                    />
                );
            }

            rows.push(<tr key={i}>{cols}</tr>);
        }

        return rows;
    }
}
