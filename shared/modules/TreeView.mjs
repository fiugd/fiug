let TREE_ROOT_ID;

const tryFn = (fn, _default) => {
  try {
    return fn();
  } catch (e) {
    return _default;
  }
};
const loop = (MAX, fn) => {
  let it = 0;
  while (fn() && it++ < MAX) {}
};
function htmlToElement(html) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstChild;
}

// js-treeview 1.1.5
const TreeView = (function () {
  var events = ["expand", "expandAll", "collapse", "collapseAll", "select"];

  function isDOMElement(obj) {
    try {
      return obj instanceof HTMLElement;
    } catch (e) {
      return (
        typeof obj === "object" &&
        obj.nodeType === 1 &&
        typeof obj.style === "object" &&
        typeof obj.ownerDocument === "object"
      );
    }
  }
  function forEach(arr, callback, scope) {
    var i,
      len = arr.length;

    for (i = 0; i < len; i += 1) {
      callback.call(scope, arr[i], i);
    }
  }

  function emit(instance, name) {
    var args = [].slice.call(arguments, 2);
    if (events.indexOf(name) > -1) {
      if (instance.handlers[name] && instance.handlers[name] instanceof Array) {
        forEach(instance.handlers[name], function (handle) {
          window.setTimeout(function () {
            handle.callback.apply(handle.context, args);
          }, 0);
        });
      }
    } else {
      throw new Error(name + " event cannot be found on TreeView.");
    }
  }

  function render(self) {
    var container = isDOMElement(self.node)
      ? self.node
      : document.getElementById(self.node);
    var leaves = [],
      click;

    var renderLeaf = function (item) {
      var leaf = document.createElement("div");
      var content = document.createElement("div");
      var text = document.createElement("div");
      var expando = document.createElement("div");
      leaf.setAttribute("class", "tree-leaf");
      if (item.name === ".keep") {
        leaf.classList.add("hidden-leaf");
      }
      content.setAttribute("class", "tree-leaf-content");
      content.setAttribute("data-item", JSON.stringify(item));
      text.setAttribute("class", "tree-leaf-text");
      text.textContent = item.name;
      expando.setAttribute(
        "class",
        "tree-expando " + (item.expanded ? "expanded open" : "closed")
      );
      expando.textContent = item.expanded ? "-" : "+";
      content.appendChild(expando);
      content.appendChild(text);
      leaf.appendChild(content);

      if (item.children && item.children.length > 0) {
        var children = document.createElement("div");
        children.setAttribute("class", "tree-child-leaves");
        forEach(item.children, function (child) {
          var childLeaf = renderLeaf(child);
          children.appendChild(childLeaf);
        });
        if (!item.expanded) {
          children.classList.add("hidden");
        }
        leaf.appendChild(children);
      } else {
        expando.classList.add("hidden");
      }
      return leaf;
    };

    forEach(self.data, function (item) {
      leaves.push(renderLeaf.call(self, item));
    });
    container.innerHTML = leaves
      .map(function (leaf) {
        return leaf.outerHTML;
      })
      .join("");

    click = function (e) {
      var parent = (e.target || e.currentTarget).parentNode;
      var data = JSON.parse(parent.getAttribute("data-item"));
      var leaves = parent.parentNode.querySelector(".tree-child-leaves");

      if (leaves) {
        if (leaves.classList.contains("hidden")) {
          self.expand(parent, leaves);
        } else {
          self.collapse(parent, leaves);
        }
      } else {
        emit(self, "select", {
          target: e,
          data: data,
        });
      }
    };

    forEach(container.querySelectorAll(".tree-leaf-text"), function (node) {
      node.onclick = click;
    });
    forEach(container.querySelectorAll(".tree-expando"), function (node) {
      node.onclick = click;
    });
  }

  function TreeView(data, node) {
    (this || _global).handlers = {};
    (this || _global).node = node;
    (this || _global).data = data;
    render(this || _global);
  }

  TreeView.prototype.expand = function (node, leaves, skipEmit) {
    var expando = node.querySelector(".tree-expando");
    expando.classList.add("expanded", "open");
    expando.classList.remove("closed");
    expando.textContent = "-";
    leaves.classList.remove("hidden");

    if (skipEmit) {
      return;
    }

    emit(this || _global, "expand", {
      target: node,
      leaves: leaves,
    });
  };

  TreeView.prototype.expandAll = function () {
    var self = this || _global;
    var nodes = document
      .getElementById(self.node)
      .querySelectorAll(".tree-expando");
    forEach(nodes, function (node) {
      var parent = node.parentNode;
      var leaves = parent.parentNode.querySelector(".tree-child-leaves");

      if (parent && leaves && parent.hasAttribute("data-item")) {
        self.expand(parent, leaves, true);
      }
    });
    emit(this || _global, "expandAll", {});
  };

  TreeView.prototype.collapse = function (node, leaves, skipEmit) {
    var expando = node.querySelector(".tree-expando");
    expando.classList.remove("expanded", "open");
    expando.classList.add("closed");
    expando.textContent = "+";
    leaves.classList.add("hidden");

    if (skipEmit) {
      return;
    }

    emit(this || _global, "collapse", {
      target: node,
      leaves: leaves,
    });
  };

  TreeView.prototype.collapseAll = function () {
    var self = this || _global;
    var nodes = document
      .getElementById(self.node)
      .querySelectorAll(".tree-expando");
    forEach(nodes, function (node) {
      var parent = node.parentNode;
      var leaves = parent.parentNode.querySelector(".tree-child-leaves");

      if (parent && leaves && parent.hasAttribute("data-item")) {
        self.collapse(parent, leaves, true);
      }
    });
    emit(this || _global, "collapseAll", {});
  };

  TreeView.prototype.on = function (name, callback, scope) {
    if (events.indexOf(name) > -1) {
      if (!(this || _global).handlers[name]) {
        (this || _global).handlers[name] = [];
      }

      (this || _global).handlers[name].push({
        callback: callback,
        context: scope,
      });
    } else {
      throw new Error(name + " is not supported by TreeView.");
    }
  };

  TreeView.prototype.off = function (name, callback) {
    var index,
      found = false;

    if ((this || _global).handlers[name] instanceof Array) {
      (this || _global).handlers[name].forEach(function (handle, i) {
        index = i;

        if (handle.callback === callback && !found) {
          found = true;
        }
      });

      if (found) {
        (this || _global).handlers[name].splice(index, 1);
      }
    }
  };

  return TreeView;
})();

class DragAndDrop {
  rootNode;

  constructor({ rootNode, move }) {
    this.rootNode = rootNode;

    this.attach = this.attach.bind(this);
    this.update = this.update.bind(this);

    this.handleDragEnter = this.handleDragEnter.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDrop = this.handleDrop.bind(this);

    this.move = move;

    this.update();
  }
  handleDragStart(e) {
    const leaf = e.target.classList.contains("tree-leaf")
      ? e.target
      : e.target.closest(".tree-leaf");
    this.dragged = leaf;
    // attach all drag listeners here instead?
  }
  handleDragEnter(e) {
    let leaf = e.target.classList.contains("tree-leaf")
      ? e.target
      : e.target.closest(".tree-leaf");
    const isRoot = leaf && !leaf.getAttribute("path").includes("/");
    if (leaf && !isRoot && !leaf.classList.contains("folder")) {
      leaf = leaf.parentNode.closest(".tree-leaf");
    } else if (isRoot && !leaf.classList.contains("folder")) {
      leaf = leaf.parentNode;
    }
    if (e.target.id === TREE_ROOT_ID) {
      leaf = e.target;
    }
    if (e.target.parentNode.id === TREE_ROOT_ID) {
      leaf = e.target.parentNode;
    }

    if (this.draggedOver) {
      this.draggedOver.classList.remove("dragover");
    }
    if (!leaf) {
      debugger;
      return;
    }
    this.draggedOver = leaf;
    leaf.classList.add("dragover");
  }
  handleDrop(e) {
    const draggedOverNodes = Array.from(document.querySelectorAll(".dragover"));
    draggedOverNodes.forEach((item) => item.classList.remove("dragover"));
    if (this.dragged && this.draggedOver) {
      this.move(
        this.dragged.getAttribute("path"),
        this.draggedOver.id === TREE_ROOT_ID
          ? ""
          : this.draggedOver.getAttribute("path")
      );
    }
    e.stopPropagation();
    return false;
  }
  preventDefault(e) {
    e.preventDefault && e.preventDefault();
    return false;
  }

  attach(rootNode) {
    const allLeaves = Array.from(
      rootNode.querySelectorAll(".tree-leaf:not([draggable])")
    );
    allLeaves.forEach((leaf) => {
      //TODO: would be better if this were done elsewhere
      const contentNode = leaf.querySelector(":scope > .tree-leaf-content");
      const { type, id: path } = tryFn(() =>
        JSON.parse(contentNode.dataset.item)
      );
      leaf.setAttribute("path", path);
      leaf.classList.add(type);

      leaf.draggable = true;

      if (type !== "folder") {
        leaf.addEventListener("dragstart", this.handleDragStart, false);
        return;
      }

      leaf.addEventListener("dragstart", this.handleDragStart, false);
      leaf.addEventListener("dragenter", this.handleDragEnter, false);
      leaf.addEventListener("drop", this.handleDrop, false);
      leaf.addEventListener("dragover", this.preventDefault, false);
    });

    rootNode.addEventListener("dragstart", this.handleDragStart, false);
    rootNode.addEventListener("dragenter", this.handleDragEnter, false);
    rootNode.addEventListener("drop", this.handleDrop, false);
    rootNode.addEventListener("dragover", this.preventDefault, false);
  }
  update() {
    this.attach(this.rootNode);
  }
}

// wrap a pre-existing node in a helper
//input: tree-leaf-text, tree-leaf-content, tree-child-leaves
//output: LeafNode helper which is bound to tree-leaf
class LeafNode {
  node;
  constructor(element) {
    this.node = element.classList.contains("tree-leaf")
      ? element
      : element.closest(".tree-leaf");

    const Getter = (name, fn) => Object.defineProperty(this, name, { get: fn });

    this.getPath = this.getPath.bind(this);

    Getter("name", () => this.getName(this.node));
    Getter("parent", () => this.getParent(this.node));
    Getter("path", () => this.getPath(this.node));
    Getter("type", () => this.getType(this.node));
    Getter("selected", () => this.getSelected(this.node));

    this.getItem = () => ({
      name: this.getName(this.node),
      id: this.getPath(this.node),
      path: this.getPath(this.node),
      type: this.getType(this.node),
      selected: this.getSelected(this.node),
    });
  }
  getName(node) {
    const treeLeafText = node.querySelector(
      ":scope > .tree-leaf-content > .tree-leaf-text"
    );
    return treeLeafText && treeLeafText.textContent;
  }
  getParent(node) {
    const parentChildLeaves = node.closest(".tree-child-leaves");
    return (parentChildLeaves || node).parentNode;
  }
  getPath(node) {
    let currentNode = node;
    const path = [];
    const MAX_ITERATIONS = 50;
    loop(MAX_ITERATIONS, () => {
      path.push(this.getName(currentNode));
      currentNode = this.getParent(currentNode);
      return currentNode.id !== TREE_ROOT_ID;
    });
    return path.reverse().join("/");
  }
  getType(node) {
    return node.classList.contains("folder") ? "folder" : "file";
  }
  getSelected(node) {
    const treeLeafContent = node.querySelector(":scope > .tree-leaf-content");
    return treeLeafContent && treeLeafContent.classList.contains("selected");
  }
}

// add node with name
class TreeNode {
  constructor(item) {
    const { name, type, id } = item;

    const expandoClass = [
      "tree-expando",
      "closed",
      type === "folder" ? "" : "hidden",
    ].join(" ");
    const container = htmlToElement(`
			<div class="tree-leaf">
				<div class="tree-leaf-content" data-item='${JSON.stringify(item)}'>
					<div class="${expandoClass}">+</div>
					<div class="tree-leaf-text">${name}</div>
				</div>
				${type === "folder" ? `<div class="tree-child-leaves hidden"></div>` : ""}
			</div>
		`);

    // TODO: remove this when rewriting underlying js-treeview (use listener at top level)
    Array.from(
      container.querySelectorAll(".tree-leaf-text, .tree-expando")
    ).forEach(function (node) {
      const hijacked = document.querySelector(".tree-leaf-text").onclick;
      node.onclick = hijacked;
    });
    return container;
  }
}

// add node without name, get from user
class NewTreeNode {
  container; //the created dom
  focus; // a function to call after dom appended
  callback; // a function from outer context called after user finished naming

  constructor(item) {
    this.finishedHandler = this.finishedHandler.bind(this);
    this.container = this.createContainer(item);
    const input = this.getBoundInput.bind(this)();

    //maybe should call this something diff than "focus", like "start"?
    this.focus = (siblings = [], callback) => {
      //TODO: pass sibling names so input can warn
      this.callback = callback;
      input.focus();
    };
    this.updateDataItem = (name) => {
      const treeLeafContent = this.container.querySelector(
        ".tree-leaf-content"
      );
      const dataItem = tryFn(() => JSON.parse(treeLeafContent.dataset.item));
      dataItem.id =
        dataItem.id === "/.newItem"
          ? name
          : dataItem.id.replace(/\.newItem/g, name);
      dataItem.name = name;
      treeLeafContent.dataset.item = JSON.stringify(dataItem);
      this.container.setAttribute("path", dataItem && dataItem.id);
    };
  }
  createContainer(item) {
    const { type } = item;
    const expandoClass = [
      "tree-expando",
      "closed",
      type === "folder" ? "" : "hidden",
    ].join(" ");
    return htmlToElement(`
			<div class="tree-leaf new">
				<div class="tree-leaf-content" data-item='${JSON.stringify(item)}'>
					<div class="${expandoClass}">+</div>
					<div class="tree-leaf-text">
						<input type="text"
							autocomplete="off"
							autocorrect="off"
							autocapitalize="off"
							spellcheck="false"
						>
					</div>
				</div>
				${type === "folder" ? `<div class="tree-child-leaves hidden"></div>` : ""}
			</div>
		`);
  }
  getBoundInput() {
    const input = this.container.querySelector("input");
    const thisFinish = finish.bind(this);
    const keydownListener = (e) => {
      const ENTER_KEY_CODE = 13;
      const ESCAPE_KEY_CODE = 27;
      if (e.keyCode == ENTER_KEY_CODE) thisFinish();
      if (e.keyCode == ESCAPE_KEY_CODE) thisFinish("cancel");

      //TODO: keep track of name and if folder already contains this name then popup error message
    };
    const focusListener = (e) => {
      input.removeEventListener("focus", focusListener, false);
      input.addEventListener("blur", thisFinish, false);
    };
    function finish(cancel) {
      input.removeEventListener("keydown", keydownListener, false);
      input.removeEventListener("blur", thisFinish, false);
      this.finishedHandler(cancel ? "" : input.value);
    }
    input.addEventListener("keydown", keydownListener, false);
    input.addEventListener("focus", focusListener, false);
    return input;
  }
  finishedHandler(name) {
    if (!name) {
      this.callback("no name provided");
      return;
    }

    this.container.querySelector(".tree-leaf-text").innerHTML = name;
    this.updateDataItem(name);

    // TODO: remove this when rewriting underlying js-treeview (use listener at top level)
    Array.from(
      this.container.querySelectorAll(".tree-leaf-text, .tree-expando")
    ).forEach(function (node) {
      const hijacked = document.querySelector(".tree-leaf-text").onclick;
      node.onclick = hijacked;
    });
    this.callback();
  }
}

// change a prev-existing node
class RenameUI {
  container;
  constructor(context) {
    this.container = context.domNode;
    this.treeLeafContent = context.treeLeafContent;
    this.treeLeafText = context.treeLeafText;
    this.siblings = context.siblings;

    this.done = this.done.bind(this);
    this.getInput = this.getInput.bind(this);
    this.keydownListener = this.keydownListener.bind(this);

    return new Promise(this.getInput);
  }
  done(cancel) {
    const {
      callback,
      currentName,
      done,
      input,
      keydownListener,
      treeLeafText,
    } = this;
    input.removeEventListener("keydown", keydownListener, false);
    input.removeEventListener("blur", done, false);
    const name = cancel ? "" : input.value;
    treeLeafText.innerHTML = name || currentName;
    callback(name);
  }
  getInput(callback) {
    const { container, done, keydownListener, treeLeafText } = this;
    this.currentName = treeLeafText.textContent;
    const newInput = `
		<input type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
		`;
    treeLeafText.innerHTML = newInput;
    const input = container.querySelector("input");
    input.value = this.currentName;
    input.addEventListener("keydown", keydownListener, false);
    input.addEventListener("blur", done, false);

    this.input = input;
    this.callback = callback;

    input.focus();
  }
  keydownListener(e) {
    const { done, siblings } = this;
    const ENTER_KEY_CODE = 13;
    const ESCAPE_KEY_CODE = 27;
    if (e.keyCode == ENTER_KEY_CODE) return done();
    if (e.keyCode == ESCAPE_KEY_CODE) return done("cancel");
    //TODO: keep track of name and if folder already contains this name then popup error message
    //see this.siblings
  }
}

// this is cool, but only necessary with js-treeview seen as untouchable and external, move away from using this
class TreeMapper {
  constructor(service, state) {
    this.state = state;
    this.service = service;
    this.get = this.get.bind(this);
    return new Proxy(service.tree[service.name], this);
  }

  mapEntry = (target) => ([k, v]) => {
    const child = {
      name: k,
      id: target.path ? `${target.path}/${k}` : k,
      //TODO: maybe should figure out better way to determine folder vs file
      type: Object.keys(v).length === 0 ? "file" : "folder",
      //children: []
    };
    if (child.type === "folder") {
      const dummyArray = [];
      dummyArray.path = target.path ? `${target.path}/${k}` : k;
      child.expanded = this.state.expand.includes(dummyArray.path);
      child.children = new Proxy(dummyArray, this);
    } else {
      child.selected = this.state.select === child.id;
    }
    return child;
  };

  sort = (a, b) => {
    if (a.type > b.type) return -1;
    if (a.type < b.type) return 1;
    return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
  };

  get(target, prop, receiver) {
    //console.log(prop)
    const realTarget = (target.path || "").split("/").reduce((all, one) => {
      return all[one] || all;
    }, this.service.tree[this.service.name]);

    const isNumericProp = !isNaN(prop) && "number";

    const propertyMapper = {
      length: (children) => children.length,
      forEach: (children) => (fn) => children.forEach(fn),
      children: (children) => children,
      number: (children) => children[prop],
      toJSON: (children) => (fn) => undefined,
    }[isNumericProp || prop];

    if (!propertyMapper) {
      debugger;
      //console.error(`Mapper proxy unable to handle prop: ${prop}`);
      return undefined;
    }

    try {
      const children = Object.entries(realTarget)
        .map(this.mapEntry(target))
        .sort(this.sort);
      return propertyMapper(children);
    } catch (error) {
      console.error(error);
    }
  }
}

const updateTreeTextClass = (mapper) => {
  const fileNodes = Array.from(
    document.querySelectorAll(
      ".tree-leaf.file > .tree-leaf-content > .tree-leaf-text"
    )
  );
  fileNodes.forEach((x) => {
    const filename = x.textContent;
    const ext = x.textContent.split(".").pop();
    const mapped = mapper(ext);
    x.classList.add(mapped);
  });
};

class ServiceTree {
  jstreeview;
  rootNode;

  constructor(service, domRoot, treeState, extensionMapper) {
    TREE_ROOT_ID = domRoot;
    const mappedTree = new TreeMapper(service, treeState);
    this.jstreeview = new TreeView(mappedTree, domRoot);

    this.emit = this.emit.bind(this.jstreeview);
    const exposedAPI = [
      "on",
      "off",
      "collapse",
      "collapseAll",
      "expand",
      "expandAll",
    ];
    for (var i = 0, len = exposedAPI.length; i < len; i++) {
      const key = exposedAPI[i];
      this[key] = this.jstreeview[key].bind(this.jstreeview);
    }

    const jsTreeViewEvents = [
      "expand",
      "expandAll",
      "collapse",
      "collapseAll",
      "select",
    ];
    this.jstreeviewOn = this.on;
    this.on = (name, callback, scope) => {
      if (jsTreeViewEvents.includes(name)) {
        return this.jstreeviewOn(name, callback, scope);
      }
      this.jstreeview.handlers[name] = this.jstreeview.handlers[name] || [];
      this.jstreeview.handlers[name].push({
        callback: callback,
        context: scope,
      });
    };

    this.add = this.add.bind(this);
    this.select = this.select.bind(this);
    this.delete = this.delete.bind(this);
    this.move = this.move.bind(this);
    this.rootNode = document.getElementById(domRoot);
    this.dragAndDrop = new DragAndDrop(this);

    this.updateIcons = () => updateTreeTextClass(extensionMapper);
    this.updateIcons();

    if (treeState.select) {
      this.select(treeState.select);
      this.currentFile = treeState.select;
      this.currentFolder = treeState.select.split("/").slice(0, -1).join("/");
    }

    // LISTENING to jstreeview to update ServiceTree
    this.on("select", ({ target, data }) => {
      this.currentFile = data.id;
      this.currentFolder = data.id.split("/").slice(0, -1).join("/");

      Array.from(this.rootNode.querySelectorAll(".selected")).forEach((s) =>
        s.classList.remove("selected")
      );
      const { target: node } = target;
      const leafContent = node.closest(".tree-leaf-content");
      leafContent.classList.add("selected");
    });

    // on expand, currentFolder is expanded folder
    // on collapse, currentFolder is currentFile's parent
  }

  // this mimics/exposes js-treeview event trigger handled by this.on
  emit(name) {
    // FYI "this" is ServiceTree.jstreeview
    if (!this.handlers[name] || !this.handlers[name] instanceof Array) return;
    const args = [].slice.call(arguments, 1);

    this.handlers[name].forEach((handle) => {
      window.setTimeout(() => {
        handle.callback.apply(handle.context, args);
      }, 0);
    });
  }

  /*
		this is for programmatically selecting a file/folder
	*/
  select(path, skipDomUpdate) {
    const splitPath = path.split("/");
    let success = false;
    let currentNode = this.rootNode;

    //TODO: dom traversal sucks, would be better to traverse an internal model?
    for (var i = 0, len = splitPath.length; i < len; i++) {
      const nodeName = splitPath[i];
      const immediateChildren = currentNode.querySelectorAll(
        ":scope > .tree-leaf"
      );
      const found = Array.from(immediateChildren).find(
        (child) => new LeafNode(child).name === nodeName
      );
      if (!found) break;

      const node = found.querySelector(":scope > .tree-leaf-content");
      const leaves = found.querySelector(":scope > .tree-child-leaves");
      if (!skipDomUpdate) {
        if (leaves) {
          this.expand(node, leaves);
        } else {
          Array.from(this.rootNode.querySelectorAll(".selected")).forEach((s) =>
            s.classList.remove("selected")
          );
          node.classList.add("selected");
        }
      }
      currentNode = leaves || found;
    }
    const isFolder = currentNode.classList.contains("tree-child-leaves");
    if (isFolder) return currentNode.closest(".tree-leaf");

    if (skipDomUpdate) return currentNode;

    const leaf = new LeafNode(currentNode);
    this.emit("select", {
      target: {
        target: currentNode.querySelector(
          ":scope > .tree-leaf-content .tree-leaf-text"
        ),
      },
      data: leaf.getItem(),
    });

    this.emit("fileSelect", { source: leaf.path });
    return currentNode;
  }

  insertDomNode(leavesNode, domNode) {
    //NOTE: cannot use a LeafNode helper here
    //TODO: this breaks the assumption that dataset.item use can be deprecated
    const domNodeContent = domNode.querySelector(":scope > .tree-leaf-content");
    const { id, type, name } = tryFn(() =>
      JSON.parse(domNodeContent.dataset.item)
    );
    const children = Array.from(leavesNode.children);
    if (!children.length) {
      leavesNode.append(domNode);
      return;
    }
    let containsFolders;
    let firstFile;
    const rightPlace = children.find((leaf) => {
      const child = new LeafNode(leaf);
      containsFolders = containsFolders || child.type === "folder";
      firstFile = firstFile
        ? firstFile
        : child.type === "file"
        ? leaf
        : undefined;
      return child.type === type && child.name > name;
    });
    // is folder AND this is last in alpha, files exist
    if (type === "folder" && !rightPlace && containsFolders && firstFile) {
      leavesNode.insertBefore(domNode, firstFile);
      return;
    }
    // is folder AND only files
    if (type === "folder" && !rightPlace && !containsFolders && firstFile) {
      leavesNode.insertBefore(domNode, children[0]);
      return;
    }
    // is folder AND this is last in alpha, no files
    // is folder AND no folders,no file
    // all other cases
    if (type === "folder" && !rightPlace) {
      leavesNode.append(domNode);
      return;
    }
    // is file AND last in alpha
    // is file AND no files
    // is file AND no files, no folders
    if (type === "file" && !rightPlace) {
      leavesNode.append(domNode);
      return;
    }
    // golden path case
    leavesNode.insertBefore(domNode, rightPlace);
  }

  add(type, name, target) {
    let newTreeNode;
    if (!name) {
      newTreeNode = new NewTreeNode({
        type,
        name: ".newItem",
        id: target + "/.newItem",
      });
    }

    const id = target ? target + "/" + name : name;
    const domNode = newTreeNode
      ? newTreeNode.container
      : new TreeNode({ name, type, id });
    const targetNode = this.select(target, "skipDomUpdate");
    const targetChildLeaves = targetNode.querySelector(
      ":scope > .tree-child-leaves"
    );
    this.insertDomNode(targetChildLeaves || targetNode, domNode);

    const nodeAddDone = () => {
      this.dragAndDrop.update();
      this.updateIcons();
      const leaf = new LeafNode(domNode);
      this.emit(type + "Add", { source: leaf.path });
    };

    if (!newTreeNode) return nodeAddDone();

    const doneCreating = (err, data) => {
      if (err) {
        domNode.remove();
        return;
      }
      this.insertDomNode(targetChildLeaves || targetNode, domNode);
      nodeAddDone();
    };
    const siblings = ["TODOErrorPopup"];
    newTreeNode.focus(siblings, doneCreating);
  }

  move(path, target) {
    // change the dom
    const domNode = this.select(path, "skipDomUpdate");
    const targetNode = this.select(target, "skipDomUpdate");
    const targetChildLeaves = targetNode.querySelector(
      ":scope > .tree-child-leaves"
    );
    this.insertDomNode(targetChildLeaves || targetNode, domNode);

    const leaf = new LeafNode(domNode);
    const selectedChild = domNode.querySelector(":scope .selected");
    const selected = selectedChild
      ? selectedChild && new LeafNode(selectedChild)
      : leaf.type === "file" && leaf.selected && leaf;
    if (selected) {
      this.currentFile = selected.path;
      this.currentFolder = selected.path.split("/").slice(0, -1).join("/");
      this.select(selected.path);
    }
    this.emit(leaf.type + "Move", { source: path, target: leaf.path });
  }

  async rename(path, _newName) {
    const domNode = this.select(path, "skipDomUpdate");
    const treeLeafContent = domNode.querySelector(".tree-leaf-content");
    const treeLeafText = domNode.querySelector(".tree-leaf-text");
    const children = domNode.querySelector(":scope > .tree-child-leaves");

    const newName =
      _newName ||
      (await new RenameUI({
        domNode,
        treeLeafContent,
        treeLeafText,
        children,
      }));

    if (!newName) return;

    const leaf = new LeafNode(domNode);

    treeLeafText.textContent = newName;
    treeLeafText.className = "tree-leaf-text";

    //insertDomNode handles sort
    const parent = !leaf.path.includes("/")
      ? domNode.closest("#" + TREE_ROOT_ID)
      : domNode.closest(".tree-child-leaves");
    this.insertDomNode(domNode.closest(".tree-child-leaves"), domNode);

    const selectedChild = domNode.querySelector(":scope .selected");
    const selected = selectedChild
      ? selectedChild && new LeafNode(selectedChild)
      : leaf.type === "file" && leaf.selected && leaf;
    if (selected) {
      this.currentFile = selected.path;
      this.currentFolder = selected.path.split("/").slice(0, -1).join("/");
      this.select(selected.path);
    }
    if (leaf.type === "file") this.updateIcons();
    this.emit(leaf.type + "Rename", { source: path, target: leaf.path });
  }

  delete(path) {
    const domNode = this.select(path, "skipDomUpdate");

    const leaf = new LeafNode(domNode);

    const selectedChild = domNode.querySelector(":scope .selected");
    const selected = selectedChild
      ? selectedChild && new LeafNode(selectedChild)
      : leaf.type === "file" && leaf.selected && leaf;
    if (selected) {
      this.currentFile = undefined;
      this.currentFolder = undefined;
    }

    const { path: source, type } = leaf;
    domNode.remove();
    this.emit(type + "Delete", { source });
  }

  /*
		rewrite the interface for on select (instead rewrite on?)
			- current returns a target mouse event and data
			- would prefer to return path (and no more/less?)
		select and expand should be the same thing?
	*/
  onSelect() {}
}

export default ServiceTree;
