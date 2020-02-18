import React, { Component } from 'react';

export default class GridSizePicker extends Component {
    handleClickSize = (size) => {
        this.props.onChange(size);
    }

    render() {
        return (
            <div className="grid-size-picker">
                {this.renderAvailableSizes()}
            </div>
        );
    }

    renderAvailableSizes() {
        const { size: selectedSize, sizes } = this.props;
        return sizes.map((size) => {
            return (
                <a 
                    key={size}
                    onClick={this.handleClickSize.bind(this, size)}
                    style={{ display: 'inline-block', margin: '0 10px', cursor: 'pointer' }}
                >
                    {this.renderGridPreview(size, selectedSize === size)}
                </a>
            );
        });
    }

    renderGridPreview(size, isSelected) {
        const rows = [];
        const cols = [];
        const percentageSize = (100 / size) + '%';
        const color = isSelected ? 'dodgerblue' : 'black';
        const tableSize = '35px';
        const colStyle = { 
            width: percentageSize,
            height: percentageSize,
            border: `2px solid ${color}`,
            borderCollapse: 'collapse',
        };

        for (let i = 0; i < size; i++) {
            cols.push(<td key={i} style={colStyle}></td>);
        }

        for (let i = 0; i < size; i++) {
            rows.push(<tr key={i}>{cols}</tr>);
        }

        return (
            <table style={{ width: tableSize, height: tableSize }}>
                <tbody>{rows}</tbody>
            </table>
        );
    }
}
