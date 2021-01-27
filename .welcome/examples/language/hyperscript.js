const App = () => ({ name, type, expandable, ...rest }) => (
  h(TimelineItem
  , { label: h(TimeLineItemLabel, { name })
    , maxContentWidth: "210px"
    }
  , h(Card
    , { style: { backgroundColor: "transparent" }
      , expandable
      }
    , h(CardTitle
      , { title:
            h("span", { style: { fontSize: 20 } }, type)
        , subtitle:
            h("span"
            , { style: { fontSize: 12 } }
            , `by ${rest.owner.name}`
            )
        , style: { padding: "10px 10px 10px 15px" }
        , actAsExpander: expandable
        }
      )
    , expandable &&
      h(CardText
      , { style: { padding: "10px 8px" } }
      , rest.contents.map((content, contentIndex) =>
          h(TimeLineItemContent
          , { type, content, key: contentIndex }
          )
        )
      )
    )
  )
);
