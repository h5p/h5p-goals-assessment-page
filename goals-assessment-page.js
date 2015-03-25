/*global Mustache*/
var H5P = H5P || {};

/**
 * Goals Assessment Page module
 * @external {jQuery} $ H5P.jQuery
 */
H5P.GoalsAssessmentPage = (function ($) {
  // CSS Classes:
  var MAIN_CONTAINER = 'h5p-goals-assessment-page';

  var GOAL_USER_DEFINED = 0;
  var GOAL_PREDEFINED = 1;
  var GOAL_PREDEFINED_SPECIFICATION = 2;

  /**
   * Initialize module.
   * @param {Object} params Behavior settings
   * @param {Number} id Content identification
   * @returns {Object} GoalsAssessmentPage GoalsAssessmentPage instance
   */
  function GoalsAssessmentPage(params, id) {
    this.$ = $(this);
    this.id = id;

    // Set default behavior.
    this.params = $.extend({}, {
      title: 'Goals assessment',
      description: '',
      lowRating: 'Learned little',
      midRating: 'Learned something',
      highRating: 'Learned a lot',
      goalSpecificationsLabel: 'Specifications',
      noGoalsText: 'You have not chosen any goals yet.',
      helpTextLabel: 'Read more',
      helpText: 'Help text'
    }, params);
  }

  /**
   * Attach function called by H5P framework to insert H5P content into page.
   *
   * @param {jQuery} $container The container which will be appended to.
   */
  GoalsAssessmentPage.prototype.attach = function ($container) {
    var self = this;
    this.currentGoals = [];

    var goalsAssessmentTemplate =
      '<div class="goals-assessment-header">' +
      ' <div role="button" tabindex="1" class="goals-assessment-help-text">{{helpTextLabel}}</div>' +
      ' <div class="goals-assessment-title">{{title}}</div>' +
      '</div>' +
      '<div class="goals-assessment-description">{{description}}</div>' +
      '<div class="goals-assessment-view"></div>' +
      '<div class="goals-finished-assessed-view"></div>';

    this.specificationParentTemplate =
      '<div class="assessment-wrapper">' +
        '<div class="assessment-value">{{goalSpecificationsLabel}}</div>' +
        '<div class="assessment-container">' +
          '<div class="assessment-counter">' +
            '<div class="assessment-goal">{{noGoalsText}}</div>' +
          '</div>' +
          '<div class="assessment-specifications"></div>' +
        '</div>' +
      '</div>';

    this.specificationChildTemplate =
      '<div class="assessment-wrapper">' +
        '<div class="assessment-container">' +
          '<div class="assessment-counter">' +
            '<div class="assessment-goal">{{noGoalsText}}</div>' +
            '<div class="assessment-rating">' +
              '<div class="rating-container">' +
                '<label class="rating-text">' +
                  '<input type="radio" class="rating-box">{{lowRating}}' +
                '</label>' +
              '</div>' +
              '<div class="rating-container">' +
                '<label class="rating-text">' +
                  '<input type="radio" class="rating-box">{{midRating}}' +
                '</label>' +
              '</div>' +
              '<div class="rating-container">' +
                '<label class="rating-text">' +
                  '<input type="radio" class="rating-box">{{highRating}}' +
                '</label>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    this.assessmentViewTemplate =
      '<div class="assessment-wrapper">' +
        '<div class="assessment-value"></div>' +
        '<div class="assessment-container">' +
          '<div class="assessment-counter">' +
            '<div class="assessment-goal">{{noGoalsText}}</div>' +
            '<div class="assessment-rating">' +
              '<div class="rating-container">' +
                '<label class="rating-text">' +
                  '<input type="radio" class="rating-box">{{lowRating}}' +
                '</label>' +
              '</div>' +
              '<div class="rating-container">' +
                '<label class="rating-text">' +
                  '<input type="radio" class="rating-box">{{midRating}}' +
                '</label>' +
              '</div>' +
              '<div class="rating-container">' +
                '<label class="rating-text">' +
                  '<input type="radio" class="rating-box">{{highRating}}' +
                '</label>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    this.$inner = $('<div>', {
      'class': MAIN_CONTAINER
    }).appendTo($container);

    this.$inner.append(Mustache.render(goalsAssessmentTemplate, self.params));

    this.createHelpTextButton();

    this.$assessmentView = $('.goals-assessment-view', this.$inner);
    this.$finishedAssessmentView = $('.goals-finished-assessed-view', this.$inner);

    this.createStandardPage();
    this.resize();
  };

  /**
   * Create help text functionality for reading more about the task
   */
  GoalsAssessmentPage.prototype.createHelpTextButton = function () {
    var self = this;

    if (this.params.helpText !== undefined && this.params.helpText.length) {
      $('.goals-assessment-help-text', this.$inner).click(function () {
        var $helpTextDialog = new H5P.JoubelUI.createHelpTextDialog(self.params.title, self.params.helpText);
        $helpTextDialog.appendTo(self.$inner.parent().parent().parent());
      });
    } else {
      $('.goals-assessment-help-text', this.$inner).remove();
    }
  };

  /**
   * Create standard page without rating buttons.
   */
  GoalsAssessmentPage.prototype.createStandardPage = function () {
    this.$assessmentView.children().remove();
    this.$assessmentView
      .append(Mustache.render(this.assessmentViewTemplate, this.params));
    $('.assessment-rating', this.$assessmentView).remove();
    this.currentGoals = [];
    this.updateCounter(true);
  };

  /**
   * Get page title
   * @returns {String} page title
   */
  GoalsAssessmentPage.prototype.getTitle = function () {
    return this.params.title;
  };

  /**
   * Updates internal list of assessment goals
   *
   * @param {Array} newGoals Array of goals
   */
  GoalsAssessmentPage.prototype.updateAssessmentGoals = function (newGoals) {
    var self = this;
    self.currentGoals = newGoals.slice(0);

    // Create standard page if there are no goals
    var goalCount = 0;
    newGoals.forEach(function (goalPage) {
      goalCount += goalPage.length;
    });
    if (goalCount <= 0) {
      self.createStandardPage();
      return;
    }

    // Clean view
    self.$assessmentView.children().remove();
    self.$finishedAssessmentView.children().remove();

    // Create and place all goals
    newGoals.forEach(function (goalsPage) {
      goalsPage.forEach(function (goalInstance) {
        self.createGoalAssessmentElement(goalInstance);
      });
    });

    // Set current goal to 0
    //this.updateAssessmentContainerHeight();
    this.jumpToGoal(0);
    this.resize();
  };

  /**
   * Places goal element into correct view
   * @param {jQuery} $goalAssessmentContainer Goal assessment container
   */
  GoalsAssessmentPage.prototype.placeGoalElement = function ($goalAssessmentContainer) {
    var goalInstance = this.getGoalInstanceFromUniqueId($goalAssessmentContainer.data('uniqueId'));
    var goalInstanceAnswered = true;

    // For goal specification parent check that all elements have been answered
    if (goalInstance.getGoalInstanceType() === GOAL_PREDEFINED
      && goalInstance.getSpecifications().length) {

      goalInstance.getSpecifications().forEach(function (specification) {
        // Check if specification is unanswered
        if (specification.goalAnswer() < 0) {
          goalInstanceAnswered = false;
        }
      });
    } else {
      if (goalInstance.goalAnswer() < 0) {
        goalInstanceAnswered = false;
      }
    }

    // Add goals to their view
    if (goalInstanceAnswered) {
      // Add already assessed goals to finished assessed view
      this.moveGoalToFinishedArea($goalAssessmentContainer);
      // Update answer value for element
      this.setAnswerInGoalElement($goalAssessmentContainer);
    } else {
      $goalAssessmentContainer.appendTo(this.$assessmentView);
    }
    this.addGoalTypeClassToElement($goalAssessmentContainer, goalInstance.getGoalInstanceType());
  };

  /**
   * Create goal assessment element from goal instance
   * @param {H5P.GoalsPage.GoalInstance} goalInstance Goal instance
   * @returns {jQuery} $goalsAssessmentContainer Goal assessment container element
   */
  GoalsAssessmentPage.prototype.createGoalAssessmentElement = function (goalInstance) {
    var self = this;

    // Skip specifications, they are included in parent element
    if (goalInstance.getGoalInstanceType() === GOAL_PREDEFINED_SPECIFICATION) {
      return;
    }

    if (goalInstance.getGoalInstanceType() === GOAL_PREDEFINED
        && goalInstance.getSpecifications().length) {

      var $goalAssessmentContainer = $(Mustache.render(self.specificationParentTemplate,
        $.extend({},
          self.params,
          {noGoalsText: goalInstance.goalText()}
        )
      ));

      var $specifications = $('.assessment-specifications', $goalAssessmentContainer);
      goalInstance.getSpecifications().forEach(function (specification) {
        var $goalSpecification = $(Mustache.render(self.specificationChildTemplate,
          $.extend({},
            self.params,
            {noGoalsText: specification.goalText()}
          )
        )).data('uniqueId', specification.getUniqueId())
          .appendTo($specifications);

        // Set the correctly answered goal
        self.initRadioGroup($goalSpecification);
        self.getAnswerForGoalInstance($goalSpecification, specification);
        self.addGoalTypeClassToElement($goalSpecification, specification.getGoalInstanceType());
      })
    } else {
      var $goalAssessmentContainer = $(Mustache.render(self.assessmentViewTemplate,
        $.extend({},
          self.params,
          {noGoalsText: goalInstance.goalText()}
        )
      ));

      // Set the correctly answered goal
      self.initRadioGroup($goalAssessmentContainer);
      self.getAnswerForGoalInstance($goalAssessmentContainer, goalInstance);
    }

    $goalAssessmentContainer.data('uniqueId', goalInstance.getUniqueId());

    // Place goal element in proper view
    this.placeGoalElement($goalAssessmentContainer);
  };

  /**
   * Add goal type class to element
   * @param {jQuery} $goalContainer Element that will get new class
   * @param {Number} goalType Integer describing goal type, 0 = User created, 1 = Predefined
   */
  GoalsAssessmentPage.prototype.addGoalTypeClassToElement = function ($goalContainer, goalType) {
    $('.assessment-container', $goalContainer).addClass('goal-type-' + goalType);
  };

  /**
   * Updates goal counter for all goals
   *
   * @params {Boolean} isNoGoals True if there are no goals.
   */
  GoalsAssessmentPage.prototype.updateCounter = function (isNoGoals) {
    var $assessmentContainers = this.$assessmentView.children();
    var maxCount = $assessmentContainers.length;

    var setCounter = function ($parent, currentPage, maxPage) {
      $('.goal-current', $parent).text(currentPage);
      $('.goal-max', $parent).text(maxPage);
    };

    if (isNoGoals !== undefined && isNoGoals) {
      setCounter($assessmentContainers, 0, 0);
    } else {
      $assessmentContainers.each(function (containerIndex) {
        setCounter($(this), containerIndex + 1, maxCount);
      });
    }
  };

  /**
   * Initialize radio group by grouping them on name and initializing change functionality
   * @param {jQuery} $radioGroup Container containing input for radio group
   */
  GoalsAssessmentPage.prototype.initRadioGroup = function ($radioGroup) {
    var self = this;
    $('input', $radioGroup)
      .change(function () {
        // Remove checked from all inputs in radio group
        $('input', $radioGroup).prop('checked', false);

        // Add checked to this radio group button
        $(this).prop('checked', true);

        // Handle that goal has been assessed
        self.goalAssessed($radioGroup, $(this).index());
      });
  };

  /**
   * Processes the assessment of a goal
   */
  GoalsAssessmentPage.prototype.goalAssessed = function ($goalAssessed) {
    var moveGoal = true;
    var goalInstance = this.getGoalInstanceFromUniqueId($goalAssessed.data('uniqueId'));
    var $assessmentViewElement = $goalAssessed;

    // Change goal instance answer
    this.setAnswerInGoalInstance($goalAssessed, goalInstance);

    // Check all children if specification
    if (goalInstance.getParent() !== undefined) {
      $assessmentViewElement = $goalAssessed.parent().parent().parent();
      var childSpecifications = goalInstance.getParent().getSpecifications();
      childSpecifications.forEach(function (specification) {
        if (specification.goalAnswer() < 0) {
          moveGoal = false;
        }
      })
    }

    // Only move goal to finished area if it is in assessment area
    if (this.$assessmentView.children().index($assessmentViewElement) >= 0 && moveGoal) {
      this.moveGoalToFinishedArea(this.$assessmentView.children().eq(0));
    }

    // Update answer value for element
    this.setAnswerInGoalElement($goalAssessed);

    this.jumpToGoal(0);
    this.resize();
  };

  /**
   * Jump to the given goal determined from provided index
   * @param {Number} toGoalIndex Index of goal to jump to.
   */
  GoalsAssessmentPage.prototype.jumpToGoal = function (toGoalIndex) {
    var self = this;

    if (toGoalIndex >= 0 && toGoalIndex < this.currentGoals.length) {
      this.$assessmentView.children().each(function (radioGroupIndex) {
        self.updateRadioStyles($(this), radioGroupIndex, toGoalIndex);
      });
    }
  };

  /**
   * Removes height of assessment container if it is empty
   */
  GoalsAssessmentPage.prototype.updateAssessmentContainerHeight = function () {
    if (this.$assessmentView.children().length <= 0) {
      this.$assessmentView.css('height', 0);
    } else {
      // Set to static height in em
      var staticAssessmentContainerHeight = 15;
      var fontSize = parseInt(this.$assessmentView.css('font-size'), 10);
      this.$assessmentView.css('height', fontSize * staticAssessmentContainerHeight);
    }
  };

  /**
   * Moves goal to finished assessment view
   * @param {jQuery} $goal Element that will be moved
   */
  GoalsAssessmentPage.prototype.moveGoalToFinishedArea = function ($goal) {
    $goal.prependTo(this.$finishedAssessmentView);
  };

  /**
   * Updates styling for radio group depending on what current index is
   * @param {Number} radioGroupIndex Index of radio group that will be styled
   * @param {Number} currentIndex Index of current radio group
   */
  GoalsAssessmentPage.prototype.updateRadioStyles = function ($goalsAssessmentPage, radioGroupIndex, currentIndex) {
    // Update css
    if (radioGroupIndex < currentIndex) {
      $goalsAssessmentPage.removeClass('next').removeClass('current').addClass('prev');
    } else if (radioGroupIndex === currentIndex) {
      $goalsAssessmentPage.removeClass('next').removeClass('prev').addClass('current');
    } else if (radioGroupIndex > currentIndex) {
      $goalsAssessmentPage.removeClass('prev').removeClass('current').addClass('next');
    }
  };

  /**
   * Gets current updated goals
   *
   * @returns {Array} this.currentGoals Goals
   */
  GoalsAssessmentPage.prototype.getAssessedGoals = function () {
    this.registerAnswersForAllGoalPages();
    return this.currentGoals;
  };

  /**
   * Returns the goal instance matching provided id
   * @param {Number} goalInstanceUniqueId Id matching unique id of target goal
   * @returns {GoalInstance|Number} Returns matching goal instance or -1 if not found
   */
  GoalsAssessmentPage.prototype.getGoalInstanceFromUniqueId = function (goalInstanceUniqueId) {
    var foundInstance = -1;
    this.currentGoals.forEach(function (goalPage) {
      goalPage.forEach(function (goalInstance) {
        if (goalInstance.getUniqueId() === goalInstanceUniqueId) {
          foundInstance = goalInstance;
        }
      });
    });

    return foundInstance;
  };

  /**
   * Checks and inserts new radio values into current goals or inserts answers into displayed goals
   * @params {Boolean} setValues True if function should insert radio values
   */
  GoalsAssessmentPage.prototype.registerAnswersForAllGoalPages = function (setValues) {
    var self = this;
    this.currentGoals.forEach(function (goalPage) {
      self.registerAnswersForSingleGoalPage(goalPage, setValues);
    });
  };

  /**
   * Registers answer for a single goal page
   * @param {Array} goalPage Array containing Goal instances
   * @param {Boolean} setValues True if function should insert radio values
   * @returns {*}
   */
  GoalsAssessmentPage.prototype.registerAnswersForSingleGoalPage = function (goalPage, setValues) {
    var self = this;
    goalPage.forEach(function (goalInstance) {
      var $finishedAssessedArray = self.$finishedAssessmentView.children();
      self.registerAnswerForGoalInstance($finishedAssessedArray, goalInstance, setValues);
    });
  };

  /**
   * Registers answer for goal instance
   * @param {jQuery} $finishedAssessedArray Container with answered goal
   * @param {GoalInstance} goalInstance Goal object
   * @param {Boolean} setValues True if function should insert radio values
   */
  GoalsAssessmentPage.prototype.registerAnswerForGoalInstance = function ($finishedAssessedArray, goalInstance, setValues) {
    var self = this;
    // Match goalInstance to element
    $finishedAssessedArray.each(function () {
      if ($(this).data('uniqueId') === goalInstance.getUniqueId()) {
        if (setValues !== undefined && setValues) {
          self.getAnswerForGoalInstance($(this), goalInstance);
        } else {
          self.setAnswerInGoalInstance($(this), goalInstance);
        }
      }
    });


  };

  /**
   * Gets the chosen answer, and displays it on corresponding container
   * @param {jQuery} $goalInstanceElement Container with answered goal
   * @param {GoalInstance} goalInstance Goal object
   */
  GoalsAssessmentPage.prototype.getAnswerForGoalInstance = function ($goalInstanceElement, goalInstance) {
    if (goalInstance.goalAnswer() > -1) {
      $('input', $goalInstanceElement)
        .eq(goalInstance.goalAnswer())
        .prop('checked', true);
    }
  };

  /**
   * Sets chosen answer in goals' goal object
   * @param {jQuery} $goalInstanceElement Container with answered goal
   * @param {GoalInstance} goalInstance Goal object
   */
  GoalsAssessmentPage.prototype.setAnswerInGoalInstance = function ($goalInstanceElement, goalInstance) {
    var chosenAlternative = $('input:checked', $goalInstanceElement)
      .parent()
      .parent()
      .index();
    if (chosenAlternative > -1) {
      goalInstance.goalAnswer(chosenAlternative);
    }
  };

  /**
   * Sets answered value as label for element
   * @param {jQuery} $goalInstanceElement  Goal instance element
   */
  GoalsAssessmentPage.prototype.setAnswerInGoalElement = function ($goalInstanceElement) {
    var goalInstance = this.getGoalInstanceFromUniqueId($goalInstanceElement.data('uniqueId'));

    // Don't set answer label on specifications
    if (goalInstance.getGoalInstanceType() === GOAL_PREDEFINED_SPECIFICATION) {
      return;
    }

    // Don't set answer label on specification parents
    if (goalInstance.getGoalInstanceType() === GOAL_PREDEFINED
      && goalInstance.getSpecifications().length) {
      return;
    }

    var $checkedAlternative = $('input:checked', $goalInstanceElement);
    var goalInstanceText = $checkedAlternative.parent().text();
    $('.assessment-value', $goalInstanceElement).text(goalInstanceText);
  };

  GoalsAssessmentPage.prototype.resize = function () {
/*    var self = this;
    var maxHeight = 0;
    // Make sure parent can fit children so they can be measured
    self.$assessmentView.css('height', 800 + 'px');
    // Find absolute height of highest assessment container
    self.$assessmentView.children().each(function () {
      var initialHeight = $(this).outerHeight();
      var child = $(this);
      console.log(child);
      console.log($(this).height());
      console.log($(this).outerHeight());
      console.log($(this).clientHeight);

      if (initialHeight > maxHeight) {
        maxHeight = initialHeight;
      }
    });

    // Set height of all assessment view to max height plus padding
    //self.$assessmentView.css('height', maxHeight);*/
  };

  return GoalsAssessmentPage;
}(H5P.jQuery));
