using ModelingToolkit
using Unitful

@connector Pin begin
    v(t), [unit = u"V"]
    i(t), [connect = Flow, unit = u"A"]
end

export Pin
