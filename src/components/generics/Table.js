import React, { Component, Fragment } from "react";
import clsx from "clsx";
import { injectIntl } from "react-intl";
import _ from "lodash";
import DeleteIcon from "@material-ui/icons/Delete";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Typography,
  Divider,
  Box,
  IconButton,
  Table as MUITable,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
  Grid,
  TablePagination,
} from "@material-ui/core";
import FormattedMessage from "./FormattedMessage";
import ProgressOrError from "./ProgressOrError";
import withModulesManager from "../../helpers/modules";
import { formatMessage, formatMessageWithValues } from "../../helpers/i18n";

const styles = (theme) => ({
  table: theme.table,
  tableTitle: theme.table.title,
  tableHeader: theme.table.header,
  tableRow: theme.table.row,
  tableLockedRow: theme.table.lockedRow,
  tableLockedCell: theme.table.lockedCell,
  tableHighlightedRow: theme.table.highlightedRow,
  tableHighlightedCell: theme.table.highlightedCell,
  tableHighlightedAltRow: theme.table.highlightedAltRow,
  tableHighlightedAltCell: theme.table.highlightedAltCell,
  tableDisabledRow: theme.table.disabledRow,
  tableDisabledCell: theme.table.disabledCell,
  tableFooter: theme.table.footer,
  pager: theme.table.pager,
  left: {
    textAlign: "left",
  },
  right: {
    textAlign: "right",
  },
  center: {
    textAlign: "center",
  },
  clickable: {
    cursor: "pointer",
  },
  loader: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    background: "rgba(0, 0, 0, 0.12)",
  },
});

class Table extends Component {
  state = {
    selection: {},
  };

  _atom = (a) =>
    !!a &&
    a.reduce((m, i) => {
      m[this.itemIdentifier(i)] = i;
      return m;
    }, {});

  componentDidMount() {
    if (this.props.withSelection) {
      this.setState((state, props) => ({
        selection: this._atom(props.selection || []),
      }));
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.withSelection && prevProps.selectAll !== this.props.selectAll) {
      this.setState(
        (state, props) => ({
          selection: _.merge(state.selection, this._atom(props.items)),
        }),
        (e) => !!this.props.onChangeSelection && this.props.onChangeSelection(Object.values(this.state.selection)),
      );
    }
    if (this.props.withSelection && prevProps.clearAll !== this.props.clearAll) {
      this.setState(
        { selection: {} },
        (e) => !!this.props.onChangeSelection && this.props.onChangeSelection(Object.values(this.state.selection)),
      );
    }
  }

  itemIdentifier = (i) => {
    if (!!this.props.itemIdentifier) {
      return this.props.itemIdentifier(i);
    } else {
      return i.uuid;
    }
  };

  isSelected = (i) => !!this.props.withSelection && !!this.state.selection[this.itemIdentifier(i)];

  select = (i,e,route) => {
    // block normal href only for left click
    if (e.type === 'click') {   
      if (!this.props.withSelection) return;
      let s = this.state.selection;
      let id = this.itemIdentifier(i);
      if (!!s[id]) {
        delete s[id];
      } else if (this.props.withSelection === "multiple") {
        s[id] = i;
      } else {
        s = { [id]: i };
      }
      this.setState(
        { selection: s },
        (e) => !!this.props.onChangeSelection && this.props.onChangeSelection(Object.values(this.state.selection)),
      );
    }
  };

  headerAction = (a) => (
    <Box flexGrow={1}>
      <Box display="flex" justifyContent="flex-end">
        {a()}
      </Box>
    </Box>
  );

  render() {
    const {
      intl,
      modulesManager,
      classes,
      module,
      header,
      preHeaders,
      headers,
      aligns = [],
      headerSpans = [],
      headerActions = [],
      colSpans = [],
      items,
      itemFormatters,
      rowHighlighted = null,
      rowHighlightedAlt = null,
      rowDisabled = null,
      rowLocked = null,
      withPagination = false,
      page = 0,
      pageSize,
      count,
      size,
      rowsPerPageOptions = [10, 20, 50],
      onChangeRowsPerPage,
      onChangePage,
      onDoubleClick,
      onDelete = null,
      fetching = null,
      error = null,
    } = this.props;
    let localHeaders = [...(headers || [])];
    let localPreHeaders = !!preHeaders ? [...preHeaders] : null;
    let localItemFormatters = [...itemFormatters];
    var i = !!headers && headers.length;
    while (localHeaders && i--) {
      if (modulesManager?.hideField(module, localHeaders[i])) {
        if (!!localPreHeaders) localPreHeaders.splice(i, 1);
        if (!!aligns && aligns.length > i) aligns.splice(i, 1);
        if (!!headerSpans && headerSpans.length > i) headerSpans.splice(i, 1);
        if (!!headerActions && headerActions.length > i) headerActions.splice(i, 1);
        if (!!colSpans && colSpans.length > i) colSpans.splice(i, 1);
        localHeaders.splice(i, 1);
        localItemFormatters.splice(i, 1);
      }
    }
    if (!!onDelete) {
      if (localPreHeaders) localPreHeaders.push("");
      localHeaders.push("");
      localItemFormatters.push((i, idx) => (
        <IconButton onClick={(e) => onDelete(idx)}>
          <DeleteIcon />
        </IconButton>
      ));
    }

    const rowsPerPage = pageSize || rowsPerPageOptions[0];
    return (
      <Box position="relative" overflow="auto">
        {header && (
          <Fragment>
            <Typography className={classes.tableTitle}>{header}</Typography>
            <Divider />
          </Fragment>
        )}
        <MUITable className={classes.table} size={size}>
          {!!localPreHeaders && localPreHeaders.length > 0 && (
            <TableHead>
              <TableRow>
                {localPreHeaders.map((h, idx) => {
                  if (headerSpans.length > idx && !headerSpans[idx]) return null;
                  return (
                    <TableCell
                      colSpan={headerSpans.length > idx ? headerSpans[idx] : 1}
                      className={clsx(classes.tableHeader, aligns.length > idx && classes[aligns[idx]])}
                      key={`preh-${idx}`}
                    >
                      {!!h && h}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
          )}
          {!!localHeaders && localHeaders.length > 0 && (
            <TableHead>
              <TableRow>
                {localHeaders.map((h, idx) => {
                  if (headerSpans.length > idx && !headerSpans[idx]) return null;
                  return (
                    <TableCell colSpan={headerSpans.length > idx ? headerSpans[idx] : 1} key={`h-${idx}`}>
                      {!!h && (
                        <Box
                          style={{
                            width: "100%",
                            cursor: headerActions.length > idx && !!headerActions[idx][0] ? "pointer" : "",
                          }}
                          onClick={headerActions.length > idx ? headerActions[idx][0] : null}
                          display="flex"
                          className={classes.tableHeader}
                          alignItems="center"
                          justifyContent={aligns.length > idx ? aligns[idx] : "left"}
                        >
                          <Box>
                            {typeof h === 'function' ? (
                              <Box>
                              {() => (h(this.state, this.props))}
                              </Box>
                            ): ( 
                            <FormattedMessage module={module} id={h} />
                            ) 
                            }
                           
                          </Box>
                          {headerActions.length > idx ? this.headerAction(headerActions[idx][1]) : null}
                        </Box>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
          )}
          <TableBody>
            {items &&
              items.length > 0 &&
              items.map((i, iidx) => (
                <TableRow
                  key={iidx}
                  selected={this.isSelected(i)}
                  onClick={(e) => this.select(i,e)}
                  href={`${process.env.PUBLIC_URL || ""}${i.route}`}
                  onDoubleClick={onDoubleClick ? () => onDoubleClick(i) : undefined}
                  className={clsx(
                    classes.tableRow,
                    !!rowLocked && rowLocked(i) ? classes.tableLockedRow : null,
                    !!rowHighlighted && rowHighlighted(i) ? classes.tableHighlightedRow : null,
                    !!rowHighlightedAlt && rowHighlightedAlt(i) ? classes.tableHighlightedAltRow : null,
                    !!rowDisabled && rowDisabled(i) ? classes.tableDisabledRow : null,
                    !!onDoubleClick && classes.clickable,
                  )}
                >
                  {localItemFormatters &&
                    localItemFormatters.map((f, fidx) => {
                      if (colSpans.length > fidx && !colSpans[fidx]) return null;
                      return (
                        <TableCell
                          colSpan={colSpans.length > fidx ? colSpans[fidx] : 1}
                          className={clsx(
                            !!rowLocked && rowLocked(i) ? classes.tableLockedCell : null,
                            !!rowHighlighted && rowHighlighted(i) ? classes.tableHighlightedCell : null,
                            !!rowHighlightedAlt && rowHighlightedAlt(i) ? classes.tableHighlightedAltCell : null,
                            !!rowDisabled && rowDisabled(i) ? classes.tableDisabledCell : null,
                            aligns.length > fidx && classes[aligns[fidx]],
                          )}
                          key={`v-${iidx}-${fidx}`}
                        >
                          {f(i, iidx)}
                        </TableCell>
                      );
                    })}
                </TableRow>
              ))}
          </TableBody>
          {!!withPagination && !!count && (
            <TableFooter className={classes.tableFooter}>
              <TableRow>
                <TablePagination
                  className={classes.pager}
                  colSpan={localItemFormatters.length}
                  labelRowsPerPage={formatMessage(intl, "core", "rowsPerPage")}
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} ${formatMessageWithValues(intl, "core", "ofPages")} ${count}`
                  }
                  count={count}
                  page={page}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={rowsPerPageOptions}
                  onRowsPerPageChange={(e) => onChangeRowsPerPage(e.target.value)}
                  onPageChange={onChangePage}
                />
              </TableRow>
            </TableFooter>
          )}
        </MUITable>
        {(fetching || error) && (
          <Grid className={classes.loader} container justifyContent="center" alignItems="center">
            <ProgressOrError progress={items?.length && fetching} error={error} />{" "}
            {/* We do not want to display the spinner with the empty table */}
          </Grid>
        )}
      </Box>
    );
  }
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(Table))));
