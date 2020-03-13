import React, { Component } from 'react';
import GridSizePicker from './GridSizePicker';
import KnockCodeGrid from './KnockCodeGrid';

import './knockCode.css';

const AVAILABLE_GRID_SIZES = [2, 3, 4];
const ERROR_MESSAGE_TIMEOUT = 6000;
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


export default class KnockCode extends Component {
    constructor(props) {
        super(props);
        this.errorMessageTimer = null;
        this.state = {
            errorMessage: null,
            gridSize: 3,
        };
    }

    handleGridSizeChange = (gridSize) => {
        this.setState({ gridSize });
    }

    handleLoginPatternSubmit = (size, pattern) => {
        if (!isPatternStrong(size, pattern)) {
            this.setErrorMessage('Přihlašovací vzor je příliš slabý!');
            return;
        }

        this.props.onSubmit({ size, pattern });
    }

    render() {
        const { errorMessage, gridSize } = this.state;
        return (
            <div className="knock-code">
                <GridSizePicker size={gridSize} sizes={AVAILABLE_GRID_SIZES} onChange={this.handleGridSizeChange} />
                <KnockCodeGrid size={gridSize} onSubmit={this.handleLoginPatternSubmit} />
                {errorMessage && <div className="error-message">{errorMessage}</div>}
            </div>
        );
    }

    clearErrorMessage = () => {
        this.setState({ errorMessage: null });
        clearTimeout(this.errorMessageTimer);
        this.errorMessageTimer = null;
    }

    setErrorMessage(errorMessage) {
        if (this.errorMessageTimer !== null) {
            clearTimeout(this.errorMessageTimer);
        }
        this.setState({ errorMessage });
        this.errorMessageTimer = setTimeout(this.clearErrorMessage, ERROR_MESSAGE_TIMEOUT);
    }
}