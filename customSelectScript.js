initializeCustomSelects();

function initializeCustomSelects() {
  const customSelects = document.querySelectorAll(".custom-select-wrapper");

  customSelects.forEach((select) => {
    initializeSelect(select);
  });
}

function setState(state, newState) {
  state.value = newState;
}

function initializeSelect(select) {
  const status = select.querySelector("#custom-select-status");
  const input = select.querySelector("input");
  const list = select.querySelector("ul");
  const options = list.querySelectorAll("li");

  options.forEach(function (option) {
    option.setAttribute("role", "option");
    option.setAttribute("tabindex", "-1"); // make li elements keyboard focusable by script only
  });

  // Initialize state for this select
  let state = { value: "initial" };

  select.addEventListener("click", (e) =>
    handleSelectClick(state, list, select, input)
  );

  select.addEventListener("keyup", function (e) {
    doKeyAction(e, state, input, list, select, options);
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".custom-select") || e.target !== input) {
      // click outside of the custom group
      toggleList(list, "Shut", select);
      setState(state, "initial");
    }
  });
}

function moveFocus(fromHere, toThere, csInput, csOptions) {
  const aOptions = Array.from(csOptions);
  // grab the currently showing options, which might have been filtered
  const aCurrentOptions = aOptions.filter(function (option) {
    if (option.style.display === "") {
      return true;
    }
  });
  // don't move if all options have been filtered out
  if (aCurrentOptions.length === 0) {
    return;
  }
  if (toThere === "input") {
    csInput.focus();
  }
  // possible start points
  switch (fromHere.target) {
    case csInput:
      if (toThere === "forward") {
        aCurrentOptions[0].focus();
      } else if (toThere === "back") {
        aCurrentOptions[aCurrentOptions.length - 1].focus();
      }
      break;
    case csOptions[0]:
      if (toThere === "forward") {
        aCurrentOptions[1].focus();
      } else if (toThere === "back") {
        csInput.focus();
      }
      break;
    case csOptions[csOptions.length - 1]:
      if (toThere === "forward") {
        aCurrentOptions[0].focus();
      } else if (toThere === "back") {
        aCurrentOptions[aCurrentOptions.length - 2].focus();
      }
      break;
    default: // middle list or filtered items
      const currentItem = document.activeElement;
      const whichOne = aCurrentOptions.indexOf(currentItem);
      if (toThere === "forward") {
        const nextOne = aCurrentOptions[whichOne + 1];
        nextOne.focus();
      } else if (toThere === "back" && whichOne > 0) {
        const previousOne = aCurrentOptions[whichOne - 1];
        previousOne.focus();
      } else {
        // if whichOne = 0
        csInput.focus();
      }
      break;
  }
}

function doFilter(input, options) {
  const terms = input.value;
  // if (terms === "") return;
  const aOptions = Array.from(options);
  const aFilteredOptions = aOptions.filter(function (option) {
    if (option.innerText.toUpperCase().startsWith(terms.toUpperCase())) {
      return true;
    }
  });
  options.forEach((option) => (option.style.display = "none"));
  aFilteredOptions.forEach(function (option) {
    option.style.display = "";
  });
  // updateStatus(aFilteredOptions.length);
}

function doKeyAction(e, state, input, list, select, options) {
  const currentFocus = document.activeElement;

  const { value: csState } = state;

  switch (e.key) {
    case "Enter":
      if (csState === "initial") {
        // if state = initial, toggleOpen and set state to opened
        toggleList(list, "Open", select);
        setState(state, "opened");
      } else if (csState === "opened" && currentFocus.tagName === "LI") {
        // if state = opened and focus on list, makeChoice and set state to closed
        makeChoice(currentFocus, input);
        toggleList(list, "Shut", select);
        setState(state, "closed");
      } else if (csState === "opened" && currentFocus === input) {
        // if state = opened and focus on input, close it
        toggleList(list, "Shut", select);
        setState(state, "closed");
      } else if (csState === "filtered" && currentFocus.tagName === "LI") {
        // if state = filtered and focus on list, makeChoice and set state to closed
        makeChoice(currentFocus, input);
        toggleList(list, "Shut", select);
        setState(state, "closed");
      } else if (csState === "filtered" && currentFocus === input) {
        // if state = filtered and focus on input, set state to opened
        toggleList(list, "Open", select);
        setState(state, "opened");
      } else {
        // i.e. csState is closed, or csState is opened/filtered but other focus point?
        // if state = closed, set state to filtered? i.e. open but keep existing input?
        toggleList(list, "Open", select);
        setState(state, "filtered");
      }
      break;
    case "Escape":
      // if state = initial, do nothing
      // if state = opened or filtered, set state to initial
      // if state = closed, do nothing
      if (csState === "opened" || csState === "filtered") {
        toggleList(list, "Shut", select);
        setState(csState, "initial");
      }
      break;
    case "ArrowDown":
      if (csState === "initial" || csState === "closed") {
        // if state = initial or closed, set state to opened and moveFocus to first
        toggleList(list, "Open", select);
        setState(state, "opened");
        moveFocus(e, "forward", input, options);
      } else {
        // if state = opened and focus on input, moveFocus to first
        // if state = opened and focus on list, moveFocus to next/first
        // if state = filtered and focus on input, moveFocus to first
        // if state = filtered and focus on list, moveFocus to next/first
        toggleList(list, "Open", select);
        setState(state, "opened");
        moveFocus(currentFocus, "forward", input, options);
      }
      break;
    case "ArrowUp":
      if (csState === "initial" || csState === "closed") {
        // if state = initial, set state to opened and moveFocus to last
        // if state = closed, set state to opened and moveFocus to last
        toggleList(list, "Open", select);
        moveFocus(e, "back", input, options);
        setState(state, "opened");
      } else {
        // if state = opened and focus on input, moveFocus to last
        // if state = opened and focus on list, moveFocus to prev/last
        // if state = filtered and focus on input, moveFocus to last
        // if state = filtered and focus on list, moveFocus to prev/last
        moveFocus(currentFocus, "back", input, options);
      }
      break;
    case "Tab":
      if (csState === "initial") {
        toggleList(list, "Shut", select);
        setState(state, "closed");
      }
      break;
    default:
      if (csState === "initial") {
        // if state = initial, toggle open, doFilter and set state to filtered
        toggleList(list, "Open", select);
        doFilter(input, options);
        setState(state, "filtered");
      } else if (csState === "opened") {
        // if state = opened, doFilter and set state to filtered
        doFilter(input, options);
        setState(state, "filtered");
      } else if (csState === "closed") {
        // if state = closed, doFilter and set state to filtered
        doFilter(input, options);
        setState(state, "filtered");
      } else {
        // already filtered
        doFilter(input, options);
      }
      break;
  }
}

function handleSelectClick(state, list, select, input) {
  const currentFocus = document.activeElement;
  switch (state.value) {
    case "initial":
      toggleList(list, "Open", select);
      setState(state, "opened");
      break;
    case "opened":
      // if state = opened and focus on input, toggleShut and set state to initial
      if (currentFocus === input) {
        toggleList(list, "Shut", select);
        setState(state, "initial");
      } else if (currentFocus.tagName === "LI") {
        makeChoice(currentFocus, input);
        toggleList(list, "Shut", select);
        setState(state, "closed");
      }
      break;
    case "filtered":
      if (currentFocus === input) {
        toggleList(list, "Shut", select);
        setState(state, "initial");
      }
      // if state = filtered and focuse on list, makeChoice and set state to closed
      if (currentFocus.tagName === "LI") {
        makeChoice(currentFocus, input);
        toggleList(list, "Shut", select);
        setState(state, "closed");
      }
      break;
    case "closed":
      toggleList(list, "Open", select);
      setState(state, "filtered");
      break;
  }
}

function makeChoice(whichOption, input) {
  const optionTitle = whichOption.querySelector("strong");
  input.value = optionTitle.textContent;
}

function toggleList(list, whichWay, select) {
  if (whichWay === "Open") {
    list.classList.remove("hidden-all");
    select.setAttribute("aria-expanded", "true");
  } else {
    // 'Shut
    list.classList.add("hidden-all");
    select.setAttribute("aria-expanded", "false");
  }
}
