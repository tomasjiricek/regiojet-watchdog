import React, { Component } from 'react';
import GridSizePicker from './GridSizePicker';
import KnockCodeGrid from './KnockCodeGrid';

import './login.css';

const AVAILABLE_GRID_SIZES = [2, 3, 4];
const MIN_PATTERN_LENGTH_BASE = 6;
const MIN_PATTERN_TILES_COUNT_BASE = 3;

function isPatternStrong(size, pattern) {
    const basicComplexityOffset = size - 1;
    const tilesCount = Object.keys(
        pattern.reduce((reduced, value) => {
            reduced[value] = (reduced[value] || 0) + 1;
            return reduced;
        }, {})
    ).length;

    const hasBasicMinimumLength = pattern.length >= MIN_PATTERN_LENGTH_BASE;
    const hasBasicMinimumTilesCount = tilesCount >= MIN_PATTERN_TILES_COUNT_BASE;
    const hasMinimumLength = pattern.length >= MIN_PATTERN_LENGTH_BASE + basicComplexityOffset;
    const hasMinimumTilesCount = tilesCount >= MIN_PATTERN_TILES_COUNT_BASE + basicComplexityOffset;

    return (
        (hasMinimumLength && hasMinimumTilesCount) ||
        (hasBasicMinimumLength && hasBasicMinimumTilesCount && tilesCount >= Math.pow(size, 2) - size) ||
        (hasBasicMinimumLength && hasMinimumTilesCount) ||
        (pattern.length >= 12 && tilesCount >= size)
    );
}


export default class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            gridSize: 3,
        };
    }

    handleGridSizeChange = (gridSize) => {
        this.setState({ gridSize });
    }

    handleLoginPatternSubmit = (size, pattern) => {
        if (!isPatternStrong(size, pattern)) {
            console.error('Login pattern is too weak.');
            return;
        }

        const encryptedData = window.btoa(JSON.stringify({ [Math.random()]: null, size, pattern }));

        // do BE request to get data for given pattern
        console.log(encryptedData);
    }

    render() {
        const { gridSize } = this.state;
        return (
            <div className="login">
                <GridSizePicker size={gridSize} sizes={AVAILABLE_GRID_SIZES} onChange={this.handleGridSizeChange} />
                <KnockCodeGrid size={gridSize} onSubmit={this.handleLoginPatternSubmit} />
            </div>
        );
    }
}