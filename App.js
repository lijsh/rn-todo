import React, { Component } from 'react'
import { View, Text, StyleSheet, Platform, ListView, Keyboard, AsyncStorage, ActivityIndicator } from 'react-native'
import Header from './header'
import Footer from './footer'
import Row from './row'

const filterItems = (filter, items) => items.filter(item => {
  if (filter === 'ALL') return true
  if (filter === 'COMPLETED') return item.complete
  if (filter === 'ACTIVE') return !item.complete
})

class App extends Component {
  state = {
    loading: true,
    allComplete: false,
    value: '',
    items: [],
    dataSource: (new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2
    })).cloneWithRows([]),
    filter: 'ALL'
  }

  componentWillMount() {
    AsyncStorage.getItem('items').then(json => {
      try {
        const items = JSON.parse(json)
        this.setSource(items, items, { loading: false })
      } catch (error) {
        this.setState({
          loading: false
        })
      }
    })
  }

  setSource = (items, itemDataSource, otherState = {}) => {
    this.setState({
      items,
      dataSource: this.state.dataSource.cloneWithRows(itemDataSource),
      ...otherState
    })
    AsyncStorage.setItem('items', JSON.stringify(items))
  }

  handleUpdateText = (key, text) => {
    const newItems = this.state.items.map(item => {
      if (item.key !== key) return item
      return {
        ...item,
        text
      }
    })
    this.setSource(newItems, filterItems(this.state.filter, newItems))
  }

  handleToggleEditing = (key, editing) => {
    const newItems = this.state.items.map(item => {
      if (item.key !== key) return item
      return {
        ...item,
        editing
      }
    })
    this.setSource(newItems, filterItems(this.state.filter, newItems))
  }

  handleToggleComplete = (key, complete) => {
    const newItems = this.state.items.map(item => {
      if (item.key !== key) return item
      return {
        ...item,
        complete
      }
    })
    this.setSource(newItems, filterItems(this.state.filter, newItems))
  }

  handleToggleAllComplete = () => {
    const complete = !this.state.allComplete
    const newItems = this.state.items.map(item => ({
      ...item,
      complete
    }))
    console.table(newItems)
    this.setSource(newItems, filterItems(this.state.filter, newItems), { allComplete: complete })
  }

  handleAddItem = () => {
    if (!this.state.value) return
    const newItems = [
      ...this.state.items,
      {
        key: Date.now(),
        text: this.state.value,
        complete: false
      }
    ]
    this.setSource(newItems, filterItems(this.state.filter, newItems), { value: '' })
  }

  handleFilter = (filter) => {
    const newItems = filterItems(filter, this.state.items)
    this.setSource(this.state.items, newItems, { filter })
  }

  handleRemoveItem = (key) => {
    const newItems = this.state.items.filter(item => item.key !== key)
    this.setSource(newItems, filterItems(this.state.filter, newItems))
  }

  handleClearComplete = () => {
    const newItems = filterItems('ACTIVE', this.state.items)
    this.setSource(newItems, filterItems(this.state.filter, newItems))
  }

  render() {
    return (
      <View style={styles.container}>
        <Header
          value={this.state.value}
          onAddItem={this.handleAddItem}
          onChange={(value) => this.setState({ value })}
          onToggleAllComplete={this.handleToggleAllComplete}
        />
        <View style={styles.content}>
          <ListView
            style={styles.list}
            enableEmptySections
            dataSource={this.state.dataSource}
            onScroll={() => Keyboard.dismiss()}
            renderRow={({ key, ...value }) => {
              return (
                <Row
                  key={key}
                  onComplete={(complete) => this.handleToggleComplete(key, complete)}
                  onRemove={() => this.handleRemoveItem(key)}
                  onUpdate={text => this.handleUpdateText(key, text)}
                  onToggleEdit={(editing) => this.handleToggleEditing(key, editing)}
                  {...value}
                />
              )
            }}
            renderSeparator={(sectionId, rowId) => {
              return <View key={rowId} style={styles.separator} />
            }}
          />
        </View>
        <Footer
          count={filterItems('ACTIVE', this.state.items).length}
          onClearComplete={this.handleClearComplete}
          onFilter={this.handleFilter}
          filter={this.state.filter}
        />
        {this.state.loading && <View style={styles.loading}>
          <ActivityIndicator
            animating
            size="large"
          />
        </View>}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    ...Platform.select({
      android: {}
    })
  },
  content: {
    flex: 1
  },
  list: {
    backgroundColor: "#FFF"
  },
  separator: {
    borderWidth: 1,
    borderColor: "#F5F5F5"
  },
  loading: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, .2)"
  }
})

export default App