// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

document.addEventListener('DOMContentLoaded', documentEvents, false);

function documentEvents() {
  document.getElementById('remove_btn').addEventListener('click',
    function () {
      myAction('remove');
    });
  document.getElementById('add_btn').addEventListener('click',
    function () {
      myAction('add');
    });
  document.getElementById('add_radio').addEventListener('change',
    function () {
      document.getElementById('default_value_wrapper').style.display = ''
      document.getElementById('add_btn').style.display = ''
      document.getElementById('remove_btn').style.display = 'none'
      document.getElementById('column_textbox').placeholder = 'Input new column name (only 1). Ex: new_date'
      saveState('action', 'add')
    });
  document.getElementById('remove_radio').addEventListener('change',
    function () {
      document.getElementById('default_value_wrapper').style.display = 'none'
      document.getElementById('add_btn').style.display = 'none'
      document.getElementById('remove_btn').style.display = ''
      document.getElementById('column_textbox').placeholder = 'Separated by 1 space. Ex: delete_flag activation_at'
      saveState('action', 'remove')
    });

  document.getElementById('column_textbox').addEventListener('blur',
    function () {
      saveState('column_textbox', document.getElementById('column_textbox').value)
    });
  document.getElementById('sql_textbox').addEventListener('blur',
    function () {
      saveState('sql_textbox', document.getElementById('sql_textbox').value)
    });
  document.getElementById('default_value_textbox').addEventListener('blur',
    function () {
      saveState('default_value_textbox', document.getElementById('default_value_textbox').value)
    });

  // <-- Load states
  loadState('column_textbox')
  loadState('sql_textbox')
  loadState('default_value_textbox')

  let action = localStorage.getItem('action')
  if (action === 'add') {
    document.getElementById('add_radio').checked = true
    document.getElementById('remove_radio').checked = false
    document.getElementById('add_radio').dispatchEvent(new Event('change'));
  }
  // End load states --->
}
function loadState(key) {
  // localStorage.setItem('sqlTool', "ahihi")
  let value = localStorage.getItem(key)
  document.getElementById(key).value = value
}

function saveState(key, value) {
  localStorage.setItem(key, value)
}

function myAction(action) {
  let columnsStr = document.getElementById('column_textbox').value

  let sqlString = document.getElementById('sql_textbox').value

  let result = sqlString
  if (action === 'add') {
    result = add(columnsStr, sqlString, result);
  } else { //remove
    result = remove(columnsStr, sqlString, result);
  }

  copyToClipboard(result)

  document.getElementById('sql_textbox').value = result
  blink()
  
  alert("Copied result to your clipboard")
}

function blink() {
  var f = document.getElementById('sql_textbox');
  f.style.background = 'yellow'
  setTimeout(function() {
     f.style.background = ''
  }, 1500);
}

function remove(columnsStr, sqlString, result) {
  let columnNames = columnsStr.split(' ').map(s => s.trim());
  columnNames.forEach(columnName => {
    const removedIndex = getRemovedIndex(sqlString, columnName);
    if (removedIndex < 0) {
      alert("Column name not found");
      return;
    }
    const regex_all = /\((.+)\)/gm;
    let offset = 0;
    while ((m = regex_all.exec(sqlString)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regex_all.lastIndex) {
        regex_all.lastIndex++;
      }
      let rowArray = m[1].split(',');
      rowArray.splice(removedIndex, 1);
      result = spliceSlice(result, m.index + 1 - offset, m[1].length, rowArray.join(','));
      offset = (sqlString.length - result.length);
    }
    sqlString = result;
  });
  return result;
}

function add(columnsStr, sqlString, result) {
  let columnName = columnsStr.trim();

  let defaultValue = document.getElementById('default_value_textbox').value.trim()

  const regex_all = /\((.+)\)/gm;

  let offset = 0;

  let isNameRow = true
  while ((m = regex_all.exec(sqlString)) !== null) {
    // column value
    let value = `\'${defaultValue}\'`

    // column name
    if (isNameRow) {
      isNameRow = false
      value = `\`${columnName}\``
    }

    if (m.index === regex_all.lastIndex) {
      regex_all.lastIndex++;
    }
    let rowArray = m[1].split(',');
    rowArray.push(value);
    result = spliceSlice(result, m.index + 1 + offset, m[1].length, rowArray.join(','));
    offset = (result.length - sqlString.length);
  }

  return result;
}

function getRemovedIndex(sqlString, column1) {
  const regex = /INSERT.*\((.*)\)/gm;

  let m;
  let columnNamesStr;
  while ((m = regex.exec(sqlString)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    columnNamesStr = m[1];
  }
  let columnNames = columnNamesStr.split(',').map(s => s.trim());
  let removedIndex = columnNames.indexOf(column1) >= 0 ? columnNames.indexOf(column1) : columnNames.indexOf('`' + column1 + '`');
  return removedIndex;
}

function spliceSlice(sqlString, index, count, add) {
  // We cannot pass negative indexes directly to the 2nd slicing operation.
  if (index < 0) {
    index = sqlString.length + index;
    if (index < 0) {
      index = 0;
    }
  }

  return sqlString.slice(0, index) + (add || "") + sqlString.slice(index + count);
}

const copyToClipboard = sqlString => {
  const el = document.createElement('textarea');
  el.value = sqlString;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};


